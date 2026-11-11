package cl.duoc.pedidos360.kafka;

public record KafkaTopicResponse(
    String name,
    int partitions,
    short replicationFactor,
    String retentionMs,
    String cleanupPolicy
) {
}
