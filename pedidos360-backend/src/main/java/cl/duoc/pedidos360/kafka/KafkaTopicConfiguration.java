package cl.duoc.pedidos360.kafka;

import java.util.Map;

import org.apache.kafka.common.config.TopicConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KafkaTopicConfiguration {

    @Bean
    public NewTopic orderCreatedTopic(KafkaMessagingProperties properties) {
        return topic(properties.orderCreatedTopic(), properties);
    }

    @Bean
    public NewTopic orderNotificationTopic(KafkaMessagingProperties properties) {
        return topic(properties.orderNotificationTopic(), properties);
    }

    private NewTopic topic(String name, KafkaMessagingProperties properties) {
        return new NewTopic(name, properties.partitions(), properties.replicationFactor())
            .configs(Map.of(
                TopicConfig.RETENTION_MS_CONFIG, Long.toString(properties.retentionMs()),
                TopicConfig.CLEANUP_POLICY_CONFIG, properties.cleanupPolicy()
            ));
    }
}
