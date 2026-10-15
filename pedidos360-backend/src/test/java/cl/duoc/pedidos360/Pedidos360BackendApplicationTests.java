package cl.duoc.pedidos360;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.rabbitmq.listener.simple.auto-startup=false")
class Pedidos360BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
