package com.courtmaster.canchas.services;

import com.courtmaster.canchas.dto.CanchaRequestDTO;
import com.courtmaster.canchas.dto.CanchaResponseDTO;
import com.courtmaster.canchas.entities.Cancha;
import com.courtmaster.canchas.repositories.CanchaRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CanchaService {

    private final CanchaRepository canchaRepository;

    @Transactional(readOnly = true)
    public List<CanchaResponseDTO> listarTodas() {
        return canchaRepository.findAll()
                .stream()
                .map(CanchaResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CanchaResponseDTO> listarActivas() {
        return canchaRepository.findByActivaTrue()
                .stream()
                .map(CanchaResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CanchaResponseDTO obtenerPorId(Long id) {
        return canchaRepository.findById(id)
                .map(CanchaResponseDTO::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Cancha no encontrada con ID: " + id));
    }

    @Transactional
    public CanchaResponseDTO crearCancha(CanchaRequestDTO dto) {
        if (canchaRepository.existsByNombreIgnoreCase(dto.nombre().trim())) {
            throw new IllegalArgumentException("Ya existe una cancha con el nombre: " + dto.nombre().trim());
        }

        Cancha nuevaCancha = Cancha.builder()
                .nombre(dto.nombre().trim())
                .tipoSuelo(dto.tipoSuelo().trim())
                .iluminacion(dto.iluminacion())
                .tarifaBase(dto.tarifaBase())
                .activa(dto.activa() != null ? dto.activa() : true)
                .build();

        return CanchaResponseDTO.fromEntity(canchaRepository.save(nuevaCancha));
    }

    @Transactional
    public CanchaResponseDTO actualizarCancha(Long id, CanchaRequestDTO dto) {
        Cancha cancha = canchaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cancha no encontrada con ID: " + id));

        if (canchaRepository.existsByNombreIgnoreCaseAndIdNot(dto.nombre().trim(), id)) {
            throw new IllegalArgumentException("Ya existe otra cancha con el nombre: " + dto.nombre().trim());
        }

        cancha.setNombre(dto.nombre().trim());
        cancha.setTipoSuelo(dto.tipoSuelo().trim());
        cancha.setIluminacion(dto.iluminacion());
        cancha.setTarifaBase(dto.tarifaBase());
        if (dto.activa() != null) {
            cancha.setActiva(dto.activa());
        }

        return CanchaResponseDTO.fromEntity(canchaRepository.save(cancha));
    }

    @Transactional
    public void desactivarCancha(Long id) {
        Cancha cancha = canchaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cancha no encontrada con ID: " + id));
        cancha.setActiva(false);
        canchaRepository.save(cancha);
    }
}

