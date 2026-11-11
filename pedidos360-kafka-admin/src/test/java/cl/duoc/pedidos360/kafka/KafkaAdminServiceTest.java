package cl.duoc.pedidos360.kafka;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AlterConfigsResult;
import org.apache.kafka.clients.admin.CreateTopicsResult;
import org.apache.kafka.clients.admin.DeleteConsumerGroupsResult;
import org.apache.kafka.clients.admin.DeleteTopicsResult;
import org.apache.kafka.clients.admin.DescribeConsumerGroupsResult;
import org.apache.kafka.clients.admin.ListConsumerGroupsResult;
import org.apache.kafka.clients.admin.ConsumerGroupDescription;
import org.apache.kafka.clients.admin.ConsumerGroupListing;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.ConsumerGroupState;
import org.apache.kafka.common.KafkaFuture;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class KafkaAdminServiceTest {

    @Test
    void createsTopicWithConfiguredPartitionsAndRetention() throws ExecutionException, InterruptedException {
        AdminClient adminClient = mock(AdminClient.class);
        CreateTopicsResult result = mock(CreateTopicsResult.class);
        when(adminClient.createTopics(anyCollection())).thenReturn(result);
        when(result.all()).thenReturn(KafkaFuture.completedFuture(null));
        KafkaTopicCreateRequest request = new KafkaTopicCreateRequest(
            "orders.audit",
            3,
            (short) 2,
            3600000L,
            "delete"
        );

        new KafkaAdminService(adminClient).createTopic(request);

        org.mockito.ArgumentCaptor<java.util.Collection<NewTopic>> topics =
            org.mockito.ArgumentCaptor.forClass(java.util.Collection.class);
        verify(adminClient).createTopics(topics.capture());
        NewTopic topic = topics.getValue().iterator().next();
        assertEquals("orders.audit", topic.name());
        assertEquals(3, topic.numPartitions());
        assertEquals(2, topic.replicationFactor());
        assertEquals("3600000", topic.configs().get("retention.ms"));
    }

    @Test
    void updatesTopicConfiguration() throws ExecutionException, InterruptedException {
        AdminClient adminClient = mock(AdminClient.class);
        AlterConfigsResult result = mock(AlterConfigsResult.class);
        when(adminClient.incrementalAlterConfigs(anyMap())).thenReturn(result);
        when(result.all()).thenReturn(KafkaFuture.completedFuture(null));

        new KafkaAdminService(adminClient).updateTopicConfig(
            "orders.audit",
            new KafkaTopicConfigRequest(7200000L, "compact")
        );

        verify(adminClient).incrementalAlterConfigs(anyMap());
    }

    @Test
    void deletesTopic() throws ExecutionException, InterruptedException {
        AdminClient adminClient = mock(AdminClient.class);
        DeleteTopicsResult result = mock(DeleteTopicsResult.class);
        when(adminClient.deleteTopics(List.of("orders.audit"))).thenReturn(result);
        when(result.all()).thenReturn(KafkaFuture.completedFuture(null));

        new KafkaAdminService(adminClient).deleteTopic("orders.audit");

        verify(adminClient).deleteTopics(List.of("orders.audit"));
    }

    @Test
    void listsConsumerGroupsWithStateAndAssignments() throws ExecutionException, InterruptedException {
        AdminClient adminClient = mock(AdminClient.class);
        ListConsumerGroupsResult listedGroups = mock(ListConsumerGroupsResult.class);
        ConsumerGroupListing listing = mock(ConsumerGroupListing.class);
        when(listing.groupId()).thenReturn("orders-group");
        when(adminClient.listConsumerGroups()).thenReturn(listedGroups);
        when(listedGroups.all()).thenReturn(KafkaFuture.completedFuture(List.of(listing)));

        DescribeConsumerGroupsResult describedGroups = mock(DescribeConsumerGroupsResult.class);
        ConsumerGroupDescription description = mock(ConsumerGroupDescription.class);
        when(description.groupId()).thenReturn("orders-group");
        when(description.state()).thenReturn(ConsumerGroupState.STABLE);
        when(description.members()).thenReturn(List.of());
        when(adminClient.describeConsumerGroups(List.of("orders-group"))).thenReturn(describedGroups);
        when(describedGroups.all()).thenReturn(KafkaFuture.completedFuture(Map.of("orders-group", description)));

        List<KafkaConsumerGroupResponse> result = new KafkaAdminService(adminClient).listConsumerGroups();

        org.junit.jupiter.api.Assertions.assertEquals(
            List.of(new KafkaConsumerGroupResponse("orders-group", "Stable", 0, List.of())),
            result
        );
    }

    @Test
    void deletesConsumerGroup() throws ExecutionException, InterruptedException {
        AdminClient adminClient = mock(AdminClient.class);
        DeleteConsumerGroupsResult result = mock(DeleteConsumerGroupsResult.class);
        when(adminClient.deleteConsumerGroups(List.of("orders-group"))).thenReturn(result);
        when(result.all()).thenReturn(KafkaFuture.completedFuture(null));

        new KafkaAdminService(adminClient).deleteConsumerGroup("orders-group");

        verify(adminClient).deleteConsumerGroups(List.of("orders-group"));
    }
}
