# Known Limitations & Engineering Roadmap: WorkSphere

## 1. Current Implementation Scope & Disclosed Limitations

1. **Storage for File Attachments**:
   - The database entities (`RequestAttachment` and `TaskAttachment`) and schema support attachment metadata (`fileName`, `fileUrl`, `fileType`, `fileSize`, `uploaderId`). In the local development environment, file uploads store mock or local URL references rather than streaming to an external cloud bucket (e.g. AWS S3 or Google Cloud Storage).
2. **Business Hours vs Calendar Hours SLA**:
   - The SLA policy engine defaults to calendar hours (24/7 continuous UTC tracking). While the database schema and policy configuration allow toggling `isBusinessHours: true`, the current calculator does not yet parse localized holiday calendars or company timezone work shifts.
3. **Real-Time WebSockets**:
   - Real-time updates currently utilize reliable, lightweight 15-second polling via React TanStack Query / interval timers rather than a persistent WebSocket or Server-Sent Events (SSE) daemon.
4. **Third-Party Email / SMS Notifications**:
   - Notifications are fully persisted in the PostgreSQL database and surfaced in the client notification center. External SMTP or Twilio SMS dispatches are not configured in local development.

---

## 2. Engineering Roadmap

### Phase 1: Enterprise Cloud Storage Integration
- Implement direct presigned URL generation for Amazon S3 / Cloudflare R2 object storage.
- Virus scanning pipeline for employee document uploads.

### Phase 2: Advanced SLA Business Calendar Engine
- Integrate localized holiday calendars (e.g. US, UK, India corporate holidays).
- Support custom business shift schedules (e.g., 9:00 AM – 6:00 PM EST).
- SLA pause rules when tickets enter `WAITING_FOR_EMPLOYEE` status.

### Phase 3: Real-Time Collaboration
- Add WebSockets (Socket.io) for live card movement on the Kanban board and instant notification delivery.
- Live typing indicators in ticket discussions.

### Phase 4: Native Mobile Application
- React Native iOS and Android companion apps for field technicians to resolve tasks and update tickets on mobile devices.
