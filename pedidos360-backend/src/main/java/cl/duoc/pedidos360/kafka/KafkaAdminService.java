package cl.duoc.pedidos360.kafka;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.Config;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.clients.admin.AlterConfigOp;
import org.apache.kafka.common.config.ConfigResource;
import org.springframework.stereotype.Service;

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
