# PHASE A
## 1. Input-Audit
- Projektziel ist klar: internes CRM-/Operations-System für Solar Mitte mit Fokus auf reale Arbeitsabläufe statt Demo-UI.
- Kernrollen sind vorgegeben (`ADMIN`, `SALES`, `TECH`, `INSTALL`, `ACCOUNTING`).
- Kernobjekte sind vorgegeben (Lead, Kunde, Projekt, Aufgabe, Notiz/Kommentar, Benutzer/Rolle, Audit Event).
- Must-have-Felder sind großteils klar spezifiziert.
- Nicht-Ziele sind klar definiert (keine Buchhaltung, keine ERP-Integrationen ohne Spezifikation, kein Multi-Tenant-MVP).
- Technische Präferenz ist implizit vorhanden (Node/Express/TypeScript/Prisma/PostgreSQL), muss aber gegen Replit-Betrieb pragmatisch validiert werden.

## 2. Fehlende Daten / Konfliktliste
### FEHLT
- Exakte Definition der Lead-Statuswerte (z. B. `NEU`, `QUALIFIZIERT`, ...).
- Exakte Definition der Projekt-Statuswerte inkl. Abbruch-/Hold-Fälle.
- Pflicht- vs. optional-Felder je Objekt in operativer Tiefe (z. B. wann Telefonnummer verpflichtend ist).
- Mandanten-/Standortlogik (ein Standort vs. mehrere Niederlassungen).
- Datenschutz-/Aufbewahrungsanforderungen (z. B. Löschfristen, DSGVO-Prozesse) im Detail.
- Berechtigungsgrenzen innerhalb von Rollen (z. B. SALES darf nur eigene Leads sehen?).
- KPI-Definitionen für Dashboard (z. B. “aktive Projekte” exakte Regel).
- Import-/Migrationserwartung (bestehende Excel-/CSV-Daten?).

### KONFLIKTE / SPANNUNGEN
- Wunsch nach skalierbarem SaaS-Fundament vs. explizit out-of-scope: komplexes Multi-Tenant-SaaS im MVP.
- Umfassende Rollenlandschaft vs. MVP-Minimalität: Risiko von zu feingranularer RBAC-Komplexität zu früh.

## 3. Annahmen-Minimierung
### ANNAHME (konservativ)
- Single-Company-Modus im MVP (kein Multi-Tenant).
- Server-rendered Webapp mit schlankem API-Layer (ein monolithisches Repo/Deployment).
- Rollenrechte zuerst auf Modul-/Aktionsebene (Create/Read/Update/Assign/Admin), keine Feldlevel-Policies im MVP.
- Dashboard mit wenigen belastbaren Kennzahlen statt komplexem BI.
- Dateianhänge sind **nicht** MVP-kritisch, können später ergänzt werden.

## 4. Produktkern
- Zentrale interne Arbeitsoberfläche für:
  1. Lead-Erfassung und Qualifizierung,
  2. Überführung in Kunde + Projekt,
  3. statusgetriebene Projektabwicklung,
  4. rollenbasierte Aufgabensteuerung,
  5. revisionsfähige Verlaufs-/Audit-Dokumentation,
  6. operative Übersicht für Führung und Backoffice.

## 5. MVP-Scope
### In Scope (MVP)
- Authentifizierung + serverseitiges RBAC.
- CRUD für Leads, Kunden, Projekte, Aufgaben, Notizen.
- Lead→Kunde/Projekt-Konvertierung (mit Audit Trail).
- Projektstatus-Tracking.
- Aufgaben-Zuweisung inkl. Fälligkeit/Priorität.
- Dashboard mit Kern-KPIs.
- Admin-Bereich für Benutzer/Rollenverwaltung.
- Audit Events für kritische Aktionen.

### Out of Scope (MVP bestätigt)
- Buchhaltung, Rechnungen, Lohn, Lager, komplexe Kalkulation, externe ERP-Schnittstellen ohne Spezifikation, Offline-Sync.

## GATE A
- Status: BESTANDEN MIT EINSCHRÄNKUNGEN
- Reifegrad: Mittel
- Kritische Lücken: fehlende Statuskataloge, KPI-Definitionen, Datenhaltungs-/Datenschutzdetails.
- Darf fortgesetzt werden: JA
- Falls JA: konservative Basis: single-tenant-internal, wenige klare Statusmodelle, serverseitige Rechte + Audit by default.
- Falls NEIN: kleinste fehlende Inputs: (nicht zutreffend).

# PHASE B
## 6. Anforderungsspezifikation
### Funktional
- Benutzer kann sich anmelden/abmelden.
- ADMIN kann Benutzer anlegen, deaktivieren, Rolle ändern.
- SALES/ADMIN können Leads erstellen, bearbeiten, zuweisen.
- Berechtigte Rollen können Lead in Kunde+Projekt konvertieren.
- TECH/INSTALL/ADMIN können Projekte und Projektstatus pflegen.
- Alle berechtigten Rollen können Aufgaben erstellen/zuweisen/abschließen.
- Rollenabhängig können Notizen zu Lead/Projekt/Aufgabe erfasst werden.
- Dashboard zeigt operative Mindestkennzahlen.

### Nicht-funktional
- Nachvollziehbarkeit: kritische Änderungen auditierbar.
- Sicherheit: serverseitige Autorisierung, gehashte Passwörter, sichere Session/JWT-Strategie.
- Wartbarkeit: klarer Domänenschnitt, keine versteckte Logik im Frontend.
- Replit-fähiger Start mit wenigen Befehlen.

## 7. Rollen- und Rechtekonzept
### Rollen
- `ADMIN`: Vollzugriff inkl. User-/Rollenverwaltung.
- `SALES`: Leads/Kunden/zugewiesene Projekte, Aufgaben im Vertriebskontext.
- `TECH`: technische Projektpflege, Aufgaben, Notizen.
- `INSTALL`: Montage-bezogene Projekt-/Task-Pflege.
- `ACCOUNTING`: lesender Zugriff auf relevante Kunden/Projekte + eigene Aufgaben/Notizen gemäß Prozess.

### Rechte-Matrix (MVP-kurz)
- Leads: `ADMIN`,`SALES` (CRU), andere Rollen Read eingeschränkt.
- Kunden: `ADMIN`,`SALES`,`ACCOUNTING` (R), `ADMIN`,`SALES` (CU).
- Projekte: `ADMIN`,`SALES`,`TECH`,`INSTALL` (R), Update primär `ADMIN`,`TECH`,`INSTALL`.
- Aufgaben: alle Rollen nach Sichtbarkeitsregeln (CRU innerhalb Zuständigkeit).
- Audit Log: Read nur `ADMIN` (optional `ACCOUNTING` read-only bei Compliance-Bedarf).

## 8. Prozess- und Statusmodell
### Lead-Status (MVP)
- `NEU` → `KONTAKTIERT` → `QUALIFIZIERT` → `ANGEBOTSPHASE` → `GEWONNEN`/`VERLOREN`.
- Fehlerfall: Konvertierung nur bei `QUALIFIZIERT` oder `GEWONNEN`.

### Projekt-Status (MVP)
- `ANGELEGT` → `PLANUNG` → `TERMINIERT` → `IN_MONTAGE` → `ELEKTRO` → `ABGESCHLOSSEN`.
- Abweichung: `PAUSIERT`, `STORNIERT`.
- Fehlerfall: Rücksprung auf frühere Status nur mit Begründung + Audit.

### Aufgaben-Status
- `OFFEN`, `IN_BEARBEITUNG`, `BLOCKIERT`, `ERLEDIGT`.

## 9. Datenmodell
### Lead
- Pflicht: `id`, `source`, `status`, `name`, `phone`, `email`, `address`, `assignedUserId`, `createdAt`.
- Optional: `note`.
- Audit-relevant: Statuswechsel, Zuweisung, Konvertierung.

### Kunde
- Pflicht: `id`, `name`, `contactName`, `phone`, `email`, `address`, `customerType`.
- Beziehung: 1:n zu Projekten.

### Projekt
- Pflicht: `id`, `projectRef`, `customerId`, `status`, `ownerUserId`, `siteAddress`, `summary`, `plannedDate`, `createdAt`, `updatedAt`.
- Optional: `notes`.
- Audit-relevant: Statuswechsel, Verantwortlichkeitswechsel.

### Aufgabe
- Pflicht: `id`, `entityType`, `entityId`, `title`, `status`, `assigneeUserId`, `dueDate`, `priority`.

### Notiz/Kommentar
- Pflicht: `id`, `entityType`, `entityId`, `authorUserId`, `timestamp`, `content`, `type`.

### Audit Event
- Pflicht: `id`, `actorUserId`, `action`, `targetType`, `targetId`, `timestamp`, `metadataJson`.

## 10. Fachliche Widerspruchsprüfung
- Widerspruch aufgelöst: kein Multi-Tenant im MVP, aber Datenmodell bleibt erweiterbar.
- Restrisiko: ACCOUNTING-Rechte unpräzise, daher konservativ read-first.
- Restrisiko: KPI-Definition noch FEHLT, wird technisch als konfigurierbare Query-Schicht vorbereitet.

## GATE B
- Status: BESTANDEN
- Reifegrad: Mittel bis gut
- Kritische Lücken: finale Rechtegrenzen je Rolle, KPI-Definition.
- Darf fortgesetzt werden: JA
- Falls JA: konservative Basis: klar definierte Statusmaschinen + grobe RBAC-Matrix + Audit für kritische Events.
- Falls NEIN: kleinste fehlende Inputs: (nicht zutreffend).

# PHASE C
## 11. Architekturentscheidung
### Empfohlen
- Monolithische Webapp (Next.js + API Routes/Route Handlers) mit Prisma + PostgreSQL.
- Begründung: ein Deployment, einfache Replit-Starts, geringe Betriebslast.
- Alternative: Express separiert vom Frontend.
- Risiko Alternative: höherer DevOps-Aufwand und mehr Konfigurationsfehler im MVP.
- Replit-Eignung: hoch (ein Prozess, einfache Env-Variablen).
- MVP-Tauglichkeit: hoch.

## 12. Replit-Tauglichkeitsprüfung
- Muss mit `npm install && npm run dev` lokal/replit starten.
- Postgres bevorzugt via Neon/Supabase managed (ANNAHME: verfügbar), sonst lokaler Docker nur außerhalb Replit.
- Keine Abhängigkeit auf lokale Systemdienste.
- Seeds und Migrationsskripte als npm scripts.

## 13. API-/Backend-Konzept
- `/api/auth/*`: Login, Logout, Session-Check.
- `/api/users/*`: ADMIN-only Userverwaltung.
- `/api/leads/*`, `/api/customers/*`, `/api/projects/*`, `/api/tasks/*`, `/api/notes/*`.
- `/api/dashboard/summary` für KPI-Aggregate.
- Serverseitige Guards: `requireAuth`, `requireRole`, optional `requireOwnership`.
- Audit-Middleware/Service für mutierende Aktionen.

## 14. Informationsarchitektur / Seitenstruktur
- `/login`
- `/dashboard`
- `/leads` + Detailseite
- `/customers` + Detailseite
- `/projects` + Detailseite
- `/tasks`
- `/admin/users` (ADMIN)
- `/admin/audit` (ADMIN)

## 15. UI-System / Komponentenplan
- Layout: Seitenleiste + Topbar + Content.
- Komponenten: DataTable, StatusBadge, RoleBadge, EntityHeader, Timeline (Notizen/Audit), TaskPanel, ConfirmDialog.
- UX-Prinzipien: wenige Klicks, klare Statusfarben, starke Formularvalidierung, keine Marketinganimation.

## 16. Repo-/Dateibaum
- `app/` oder `apps/web/app/` für Seiten/Routes.
- `lib/auth`, `lib/rbac`, `lib/audit`, `lib/db`.
- `features/leads|projects|tasks/...` mit `server` + `ui`.
- `prisma/schema.prisma`, `prisma/seed.ts`.
- `tests/` für Unit + Integration.

## 17. Technische Widerspruchsprüfung
- Konflikt vermieden: kein Microservice-Split.
- Konflikt offen: vorhandene Repo-Struktur kann von Zielstruktur abweichen; deshalb inkrementelle Integration statt radikaler Migration.

## GATE C
- Status: BESTANDEN
- Reifegrad: Gut
- Kritische Lücken: konkrete DB-Hosting-Entscheidung für Replit, vorhandene Repo-Module müssen auf Zielarchitektur gemappt werden.
- Darf fortgesetzt werden: JA
- Falls JA: konservative Basis: monolithisches Next.js + Prisma + Postgres, serverseitige RBAC/Audit-Kontrollen.
- Falls NEIN: kleinste fehlende Inputs: (nicht zutreffend).

# PHASE D
## 18. Master-Build-Vorlage
1. Auth-Basis (Login + Session + RBAC-Middleware).
2. Datenmodell finalisieren + Migration + Seed.
3. Leads-Modul inkl. Konvertierung.
4. Kunden-/Projekt-Modul.
5. Aufgaben-/Notiz-Modul.
6. Dashboard KPIs.
7. Admin User/Roles + Audit-Ansicht.
8. Stabilisierung + Tests + Deployment-Readme.

## 19. Frontend-Bauplan
- Sprint 1: Login, Dashboard-Shell, Leads-Liste/Detail/Form.
- Sprint 2: Kunden + Projekte inkl. Statusübergänge.
- Sprint 3: Aufgabenboard/Liste + Notiz-Timeline.
- Sprint 4: Admin-Seiten, Validierungs- und UX-Härtung.

## 20. Backend-Bauplan
- DTO/Schema-Validierung (z. B. Zod).
- Service-Layer je Domäne (`leadService`, `projectService`...).
- Repository-Zugriffe über Prisma.
- Einheitliches Fehlerformat + HTTP-Codes.

## 21. Auth/RBAC/Security-Bauplan
- Passwort-Hashing (bcrypt/argon2).
- HttpOnly Secure Cookies oder signierte Tokens serverseitig geprüft.
- Middleware für Rolle + Ownership.
- CSRF-Schutz bei Cookie-Session.
- Rate limiting auf Auth-Endpunkte.
- Audit-Logging bei Login, Rollenänderung, Statusänderung, Lösch-/Konvertieraktionen.

## 22. DB/Storage/Seed-Bauplan
- Prisma-Modelle: `User`, `Lead`, `Customer`, `Project`, `Task`, `Note`, `AuditEvent`.
- Enumerationen für Rollen/Status.
- Seeds: 1 Admin + Beispielnutzer je Rolle + Demo-Leads/Projekte.
- Soft-Delete optional, im MVP nur falls Compliance nötig (FEHLT Entscheidung).

## 23. Teststrategie
- Unit-Tests: Statustransitionen, RBAC-Regeln, Konvertierungslogik.
- Integrationstests: API CRUD + Rechteverletzung + Audit-Schreibung.
- E2E Smoke: Login, Lead anlegen, Konvertieren, Projektstatus ändern, Aufgabe abschließen.
- Security-Checks: unauthorized/forbidden Fälle als feste Testfälle.

## 24. Deployment/README/Env-Plan
- `.env.example` mit minimalen Variablen (`DATABASE_URL`, `AUTH_SECRET`, `APP_URL`).
- README: Setup, Migration, Seed, Start, Test.
- Replit-Deployment: Build/Start-Kommandos dokumentieren.
- Backup/Restore-Hinweise für Postgres (MVP-light).

## GATE D
- Status: BESTANDEN MIT EINSCHRÄNKUNGEN
- Reifegrad: Gut
- Kritische Lücken: finale KPI-Formeln, Datenschutz-/Retention-Policy, DB-Hosting final.
- Darf fortgesetzt werden: JA
- Falls JA: konservative Basis: funktionsfähiger Monolith mit klaren Modulen und testbaren Kernprozessen.
- Falls NEIN: kleinste fehlende Inputs: (nicht zutreffend).

# PHASE E
## 25. Build-Risiken
- Scope Creep durch zu frühe Zusatzfunktionen (Angebotskalkulation etc.).
- Zu detaillierte Rollenmatrix bremst MVP.

## 26. Type-/Runtime-Risiken
- Uneinheitliche Validierung zwischen Frontend und Backend.
- Race Conditions bei gleichzeitigen Statusupdates.

## 27. Security-Risiken
- Fehlende serverseitige Ownership-Checks.
- Unvollständige Audit-Trails bei indirekten Änderungen.
- Schwache Secret-Verwaltung in Replit-Umgebung.

## 28. UX-/Workflow-Risiken
- Zu komplexe Formulare für Monteure/Technik.
- Unklare Statusbezeichnungen führen zu Prozessfehlern.

## 29. Betriebs-/Performance-Risiken
- N+1-Abfragen in Listen mit Notizen/Tasks.
- Fehlende Indizes auf `status`, `assignee`, `createdAt`.
- Dashboard-Queries ohne Caching können teuer werden.

## 30. Finale GO / GO MIT EINSCHRÄNKUNGEN / NO-GO-Einschätzung
- Entscheidung: **GO MIT EINSCHRÄNKUNGEN**.
- Einschränkungen: vor Umsetzung final klären: Statuskataloge, KPI-Definitionen, Datenschutz/Retention, ACCOUNTING-Sichtgrenzen.

# ABSCHLUSS
1. Executive Summary
- Das Projekt ist MVP-fähig und kann mit einer konservativen, monolithischen Replit-Architektur schnell umgesetzt werden.
- Der größte Erfolgshebel ist ein strikter Fokus auf Lead→Projekt→Task→Audit-Kernprozess.

2. Wichtigste Risiken
- Unklare Status- und KPI-Definitionen.
- Überkomplexes Rechtekonzept zu früh.
- Sicherheitslücken bei Ownership-Prüfung.

3. Konservative Empfehlungen
- Erst 5–7 Kernstatus je Entität, später erweitern.
- RBAC grob starten, jede Ausweitung testgetrieben.
- Audit by default für alle kritischen Mutationen.

4. Was sofort in Replit umsetzbar ist
- Auth + RBAC-Middleware.
- Leads/Kunden/Projekte/Aufgaben/Notizen CRUD.
- Dashboard-Summary + Admin-Userverwaltung.
- Seed-Daten + E2E-Smoke-Flow.

5. Was noch fehlt
- Final freigegebene Statuslisten.
- KPI-Definitionsblatt.
- Datenschutz-/Retention-Entscheidungen.
- Feingranulare Zugriffspolitik für ACCOUNTING.

6. Finalurteil: **GO MIT EINSCHRÄNKUNGEN**.
