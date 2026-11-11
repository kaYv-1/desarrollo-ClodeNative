package cl.duoc.pedidos360.kafka;

import org.apache.kafka.clients.admin.AdminClient;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.boot.ssl.SslBundles;

@Configuration
public class KafkaAdminConfig {

    @Bean
    public KafkaAdmin kafkaAdmin(KafkaProperties properties, SslBundles sslBundles) {
        return new KafkaAdmin(properties.buildAdminProperties(sslBundles));
    }

    @Bean(destroyMethod = "close")
    public AdminClient kafkaAdminClient(KafkaProperties properties, SslBundles sslBundles) {
        return AdminClient.create(properties.buildAdminProperties(sslBundles));
    }
}
