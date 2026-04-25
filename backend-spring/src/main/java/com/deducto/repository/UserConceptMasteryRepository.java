package com.deducto.repository;

import com.deducto.entity.UserConceptMastery;
import com.deducto.entity.UserConceptMasteryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface UserConceptMasteryRepository extends JpaRepository<UserConceptMastery, UserConceptMasteryId> {

    @Query("SELECT m FROM UserConceptMastery m WHERE m.id.conceptId IN :ids")
    List<UserConceptMastery> findByConceptIdIn(@Param("ids") Collection<Long> conceptIds);

    @Query("SELECT COALESCE(AVG(m.masteryScore), 0) FROM UserConceptMastery m WHERE m.id.conceptId IN :ids")
    Object averageMasteryScoreByConceptIdIn(@Param("ids") Collection<Long> conceptIds);
}
