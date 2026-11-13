package cl.duoc.pedidos360.service;

import cl.duoc.pedidos360.model.Cliente;
import cl.duoc.pedidos360.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public Cliente crearCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    public Optional<Cliente> obtenerClientePorId(Long id) {
        return clienteRepository.findById(id);
    }

    public List<Cliente> obtenerTodosLosClientes() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> obtenerClientePorEmail(String email) {
        return clienteRepository.findByEmail(email);
    }

    public Cliente obtenerOCrearClientePorEmail(String email, String nombre) {
        return clienteRepository.findByEmail(email)
            .orElseGet(() -> {
                Cliente nuevo = new Cliente();
                nuevo.setEmail(email);
                nuevo.setNombre(nombre != null && !nombre.isBlank() ? nombre : email);
                nuevo.setTelefono("N/A");
                nuevo.setDireccion("N/A");
                nuevo.setCiudad("N/A");
                nuevo.setPais("Chile");
                return clienteRepository.save(nuevo);
            });
    }

    public Cliente actualizarClientePorEmail(String email, Cliente clienteActualizado) {
        Cliente cliente = obtenerOCrearClientePorEmail(email, clienteActualizado.getNombre());
        if (clienteActualizado.getNombre() != null && !clienteActualizado.getNombre().isBlank()) {
            cliente.setNombre(clienteActualizado.getNombre());
        }
        if (clienteActualizado.getTelefono() != null) {
            cliente.setTelefono(clienteActualizado.getTelefono());
        }
        if (clienteActualizado.getDireccion() != null) {
            cliente.setDireccion(clienteActualizado.getDireccion());
        }
        if (clienteActualizado.getCiudad() != null) {
            cliente.setCiudad(clienteActualizado.getCiudad());
        }
        if (clienteActualizado.getPais() != null) {
            cliente.setPais(clienteActualizado.getPais());
        }
        if (clienteActualizado.getCodigoPostal() != null) {
            cliente.setCodigoPostal(clienteActualizado.getCodigoPostal());
        }
        return clienteRepository.save(cliente);
    }

    public Cliente actualizarCliente(Long id, Cliente clienteActualizado) {
        return clienteRepository.findById(id).map(cliente -> {
            cliente.setNombre(clienteActualizado.getNombre());
            cliente.setEmail(clienteActualizado.getEmail());
            cliente.setTelefono(clienteActualizado.getTelefono());
            cliente.setDireccion(clienteActualizado.getDireccion());
            cliente.setCiudad(clienteActualizado.getCiudad());
            cliente.setPais(clienteActualizado.getPais());
            cliente.setCodigoPostal(clienteActualizado.getCodigoPostal());
            return clienteRepository.save(cliente);
        }).orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
    }

    public void eliminarCliente(Long id) {
        clienteRepository.deleteById(id);
    }
}
