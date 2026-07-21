-- Agenda del proveedor: lugar del evento y confirmación de reservación.
-- Una consulta confirmada se convierte en un evento agendado (quién, dónde, cuándo)
-- y bloquea la fecha en provider_availability.

alter table inquiries
  add column event_location text;

alter table inquiries
  drop constraint inquiries_status_check;

alter table inquiries
  add constraint inquiries_status_check
  check (status in ('new', 'read', 'replied', 'closed', 'confirmed'));
