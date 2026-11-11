package cl.duoc.pedidos360.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.boot.ssl.SslBundles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaAdmin;

@Configuration
public class KafkaAdminConfig {

    @Bean
    public KafkaAdmin kafkaAdmin(
        KafkaProperties properties,
        SslBundles sslBundles,
        @Value("${spring.kafka.admin.auto-create:false}") boolean autoCreate
    ) {
        KafkaAdmin kafkaAdmin = new KafkaAdmin(properties.buildAdminProperties(sslBundles));
        kafkaAdmin.setAutoCreate(autoCreate);
        return kafkaAdmin;
    }

}
