package cl.duoc.pedidos360.kafka;

import java.util.List;

public record KafkaConsumerGroupResponse(
    String groupId,
    String state,
    int members,
    List<String> topics
) {
}
