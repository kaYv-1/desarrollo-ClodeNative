package cl.duoc.pedidos360.kafka;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AlterConfigOp;
import org.apache.kafka.clients.admin.Config;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.clients.admin.ConsumerGroupDescription;
import org.apache.kafka.clients.admin.ConsumerGroupListing;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.config.ConfigResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class KafkaAdminService {

    private final AdminClient adminClient;

    public void createTopic(KafkaTopicCreateRequest request) {
        try {
            adminClient.createTopics(List.of(new NewTopic(
                request.name(),
                request.partitions(),
                request.replicationFactor()
            ).configs(Map.of(
                "retention.ms", Long.toString(request.retentionMs()),
                "cleanup.policy", request.cleanupPolicy()
            )))).all().get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La creación del tópico Kafka fue interrumpida.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("No se pudo crear el tópico Kafka.", exception.getCause());
        }
    }

    public List<KafkaTopicResponse> listTopics() {
        try {
            Map<String, TopicDescription> descriptions = adminClient.describeTopics(
                adminClient.listTopics().names().get()
            ).allTopicNames().get();
            List<KafkaTopicResponse> topics = new ArrayList<>();
            descriptions.forEach((name, description) -> topics.add(toResponse(name, description)));
            return topics.stream().sorted(Comparator.comparing(KafkaTopicResponse::name)).toList();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La consulta de tópicos Kafka fue interrumpida.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("No se pudieron listar los tópicos Kafka.", exception.getCause());
        }
    }

    public KafkaTopicResponse getTopic(String name) {
        try {
            TopicDescription description = adminClient.describeTopics(List.of(name))
                .allTopicNames().get().get(name);
            if (description == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el tópico Kafka.");
            }
            return toResponse(name, description);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La consulta del tópico Kafka fue interrumpida.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("No se pudo consultar el tópico Kafka.", exception.getCause());
        }
    }

    public void updateTopicConfig(String name, KafkaTopicConfigRequest request) {
        ConfigResource resource = new ConfigResource(ConfigResource.Type.TOPIC, name);
        Map<ConfigResource, Collection<AlterConfigOp>> configs = Map.of(resource, List.of(
            new AlterConfigOp(new ConfigEntry("retention.ms", Long.toString(request.retentionMs())),
                AlterConfigOp.OpType.SET),
            new AlterConfigOp(new ConfigEntry("cleanup.policy", request.cleanupPolicy()),
                AlterConfigOp.OpType.SET)
        ));
        try {
            adminClient.incrementalAlterConfigs(configs).all().get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La actualización del tópico Kafka fue interrumpida.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("No se pudo actualizar la configuración del tópico Kafka.",
                exception.getCause());
        }
    }

    public void deleteTopic(String name) {
        try {
            adminClient.deleteTopics(List.of(name)).all().get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La eliminación del tópico Kafka fue interrumpida.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("No se pudo eliminar el tópico Kafka.", exception.getCause());
        }
    }

    public List<KafkaConsumerGroupResponse> listConsumerGroups() {
        try {
            List<String> groupIds = adminClient.listConsumerGroups().all().get().stream()
                .map(ConsumerGroupListing::groupId)
                .sorted()
                .toList();
            if (groupIds.isEmpty()) {
                return List.of();
            }
            return describeConsumerGroups(groupIds).values().stream()
                .map(this::toResponse)
                .sorted(Comparator.comparing(KafkaConsumerGroupResponse::groupId))
                .toList();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La consulta de consumer groups Kafka fue interrumpida.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("No se pudieron listar los consumer groups Kafka.", exception.getCause());
        }
    }

    public KafkaConsumerGroupResponse getConsumerGroup(String groupId) {
        try {
            ConsumerGroupDescription description = describeConsumerGroups(List.of(groupId)).get(groupId);
            if (description == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró el consumer group Kafka.");
            }
            return toResponse(description);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La consulta del consumer group Kafka fue interrumpida.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("No se pudo consultar el consumer group Kafka.", exception.getCause());
        }
    }

    public void deleteConsumerGroup(String groupId) {
        try {
            adminClient.deleteConsumerGroups(List.of(groupId)).all().get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La eliminación del consumer group Kafka fue interrumpida.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("No se pudo eliminar el consumer group Kafka.", exception.getCause());
        }
    }

    private Map<String, ConsumerGroupDescription> describeConsumerGroups(List<String> groupIds)
        throws InterruptedException, ExecutionException {
        return adminClient.describeConsumerGroups(groupIds).all().get();
    }

    private KafkaConsumerGroupResponse toResponse(ConsumerGroupDescription description) {
        List<String> topics = description.members().stream()
            .flatMap(member -> member.assignment().topicPartitions().stream())
            .map(TopicPartition::topic)
            .distinct()
            .sorted()
            .toList();
        return new KafkaConsumerGroupResponse(
            description.groupId(),
            description.state().toString(),
            description.members().size(),
            topics
        );
    }

    private KafkaTopicResponse toResponse(String name, TopicDescription description) {
        short replicationFactor = (short) description.partitions().stream()
            .mapToInt(partition -> partition.replicas().size())
            .max()
            .orElse(0);
        Map<ConfigResource, Config> configs;
        try {
            configs = adminClient.describeConfigs(List.of(
                new ConfigResource(ConfigResource.Type.TOPIC, name)
            )).all().get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La consulta de configuración Kafka fue interrumpida.", exception);
        } catch (ExecutionException exception) {
            throw new IllegalStateException("No se pudo consultar la configuración Kafka.", exception.getCause());
        }
        Config config = configs.values().iterator().next();
        return new KafkaTopicResponse(
            name,
            description.partitions().size(),
            replicationFactor,
            config.get("retention.ms").value(),
            config.get("cleanup.policy").value()
        );
    }
}
