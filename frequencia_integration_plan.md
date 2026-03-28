# Implementation Plan - Frequência Integration (Phase 2)

**Goal:** Address the "Attention Points" identified in the `/frequencia` module analysis to transition it from a daily registry to a fully integrated academic tool.

## 📋 Features to Implement

### 1. Frequência ↔ Boletim (Notas) Integration
- [ ] **Data Aggregation:** Modify `NotasPage.web.tsx` (and mobile) to fetch total absences from the `frequencias` table instead of relying on manually entered values or placeholders.
- [ ] **Service Update:** Add a method in `frequenciaService.ts` to get aggregated absences per student/period.

### 2. Notificações de Falta para Responsáveis
- [ ] **Auto-Alert:** Update `useSalvarFrequencias` mutation to trigger an internal notification in the `escola_notifications` table when a student is marked as "Falta".
- [ ] **Portal Push:** Ensure these notifications are visible in the Family Portal (NotificationBell).

### 3. Relatório Consolidado de Frequência
- [ ] **Monthly View:** Implement a new `FrequenciaRelatoriosPage.web.tsx` that shows a matrix of students vs. days of the month with total presence/absence percentage.
- [ ] **Hooks:** Add `useRelatorioMensalFrequencia` in `src/modules/frequencia/hooks.ts`.

### 4. Calendário Escolar & Dias Letivos
- [ ] **Validation:** Add a check in `FrequenciaPage` to alert user if they are launching frequency on a weekend or holiday (if calendar settings exist).
- [ ] **Defaulting:** Prevent launching frequency on future dates.

### 5. Vincular com Planos de Aula
- [ ] **Integration:** Add a `plano_aula_id` column/logic to the frequency record to link the attendance call to the specific content taught that day.

---

## 🛠️ Technical Steps

### Phase 1: Aggregation & Notas Integration
- Add `buscarResumoFaltasPorPeriodo` to `frequenciaService`.
- Update `NotasPage` to show "Faltas (Automático)" based on this service.

### Phase 2: Notifications
- Add a trigger after `supabase.from('frequencias').insert()` to notify parents for students with status 'falta'.

## ⚠️ Potential Trade-offs/Edge Cases
- **Legacy Absences:** Should we overwrite custom-entered absences in the report card with the automated total?
- **Justifications:** Justified absences ('justificada') should NOT count against the student's grading limit (depending on school rules).
- **Notification Spam:** How to avoid sending multiple notifications if a teacher saves the frequency multiple times for the same day? (We should use a "dedup" window or check if notice was already sent).

---
**Requesting Feedback:** @USER, please approve this plan or specify which items are priority.
