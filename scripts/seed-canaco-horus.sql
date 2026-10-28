INSERT OR IGNORE INTO tenants (id, name, slug) 
VALUES ('canaco_merida', 'CÁMARA NACIONAL DE COMERCIO, SERVICIOS Y TURISMO DE MÉRIDA', 'canaco_merida');

INSERT OR REPLACE INTO users (id, email, full_name, password_hash, email_verified_at, platform_role) 
VALUES (
  'usr_canaco_admin_horus', 
  'horus.i2d@gmail.com', 
  'Horus - Administrador Cameral CANACO Mérida', 
  'pbkdf2_sha256$25000$58f69e7a350a543ebede3ffc53bf8dbd$ad3bb14beaf8e369e0219e5684613669ecbb7a870327f53cbedbe19b4eb859f3', 
  unixepoch(), 
  'user'
);

INSERT OR REPLACE INTO tenant_memberships (user_id, tenant_id, role, created_at) 
VALUES ('usr_canaco_admin_horus', 'canaco_merida', 'admin', unixepoch());
