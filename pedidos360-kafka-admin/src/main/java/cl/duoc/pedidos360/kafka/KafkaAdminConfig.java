package cl.duoc.pedidos360.kafka;

import org.apache.kafka.clients.admin.AdminClient;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.boot.ssl.SslBundles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KafkaAdminConfig {

    @Bean(destroyMethod = "close")
    public AdminClient kafkaAdminClient(KafkaProperties properties, SslBundles sslBundles) {
        return AdminClient.create(properties.buildAdminProperties(sslBundles));
    }
}
