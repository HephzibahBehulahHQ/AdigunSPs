BEGIN;

-- Devices are provisioned by a trusted administrator or in the SQL Editor.
-- Client users cannot create or reassign device identities.
CREATE TABLE IF NOT EXISTS adigunsps.hardware_devices (
  device_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  label text NOT NULL DEFAULT 'ESP32 device'
    CHECK (char_length(label) BETWEEN 1 AND 100),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, owner_id)
);

CREATE TABLE IF NOT EXISTS adigunsps.hardware_client_heartbeats (
  device_id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,
  heartbeat_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (device_id, owner_id)
    REFERENCES adigunsps.hardware_devices(device_id, owner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS adigunsps.hardware_device_state (
  device_id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,
  last_device_heartbeat_at timestamptz,
  connection_state text NOT NULL DEFAULT 'offline'
    CHECK (connection_state IN (
      'offline', 'awaiting_sync', 'ready', 'hard_fault',
      'interlock_fault', 'command_failed'
    )),
  fault_code text,
  gpio_readback jsonb NOT NULL DEFAULT
    '{"forward":false,"reverse":false,"lamp":false,"alarm":false}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (device_id, owner_id)
    REFERENCES adigunsps.hardware_devices(device_id, owner_id) ON DELETE CASCADE,
  CHECK (
    CASE
      WHEN jsonb_typeof(gpio_readback) = 'object'
       AND jsonb_typeof(gpio_readback->'forward') = 'boolean'
       AND jsonb_typeof(gpio_readback->'reverse') = 'boolean'
       AND jsonb_typeof(gpio_readback->'lamp') = 'boolean'
       AND jsonb_typeof(gpio_readback->'alarm') = 'boolean'
      THEN NOT (
        (gpio_readback->>'forward')::boolean
        AND (gpio_readback->>'reverse')::boolean
      )
      ELSE false
    END
  )
);

CREATE TABLE IF NOT EXISTS adigunsps.hardware_commands (
  command_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  command_type text NOT NULL CHECK (command_type IN ('SYNC', 'SET_OUTPUTS')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'claimed', 'acked', 'nacked', 'fault')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '3 seconds'),
  received_at timestamptz,
  completed_at timestamptz,
  result jsonb,
  error_code text,
  FOREIGN KEY (device_id, owner_id)
    REFERENCES adigunsps.hardware_devices(device_id, owner_id) ON DELETE CASCADE,
  UNIQUE (command_id, device_id, owner_id),
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '3 seconds'),
  CHECK (
    (status = 'queued' AND received_at IS NULL AND completed_at IS NULL)
    OR
    (status = 'claimed' AND received_at IS NOT NULL AND completed_at IS NULL)
    OR
    (status IN ('acked', 'nacked', 'fault')
      AND received_at IS NOT NULL AND completed_at IS NOT NULL)
  ),
  CHECK (result IS NULL OR jsonb_typeof(result) = 'object'),
  CHECK (
    CASE
      WHEN command_type = 'SYNC' THEN payload = '{}'::jsonb
      WHEN command_type = 'SET_OUTPUTS' THEN
        CASE
          WHEN jsonb_typeof(payload) = 'object'
           AND payload ?& ARRAY['forward', 'reverse', 'lamp', 'alarm']
           AND payload - ARRAY['forward', 'reverse', 'lamp', 'alarm'] = '{}'::jsonb
           AND jsonb_typeof(payload->'forward') = 'boolean'
           AND jsonb_typeof(payload->'reverse') = 'boolean'
           AND jsonb_typeof(payload->'lamp') = 'boolean'
           AND jsonb_typeof(payload->'alarm') = 'boolean'
          THEN NOT (
            (payload->>'forward')::boolean
            AND (payload->>'reverse')::boolean
          )
          ELSE false
        END
      ELSE false
    END
  )
);

CREATE TABLE IF NOT EXISTS adigunsps.hardware_device_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  command_id uuid REFERENCES adigunsps.hardware_commands(command_id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'command_issued', 'command_received', 'ack', 'nack', 'fault',
    'command_timeout', 'heartbeat_lost', 'interlock_violation',
    'hard_fault', 'sync_required', 'device_state'
  )),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(details) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (device_id, owner_id)
    REFERENCES adigunsps.hardware_devices(device_id, owner_id) ON DELETE CASCADE
);

ALTER TABLE adigunsps.hardware_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE adigunsps.hardware_client_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE adigunsps.hardware_device_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE adigunsps.hardware_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE adigunsps.hardware_device_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON adigunsps.hardware_devices,
  adigunsps.hardware_client_heartbeats,
  adigunsps.hardware_device_state,
  adigunsps.hardware_commands,
  adigunsps.hardware_device_events
FROM anon, authenticated;

GRANT USAGE ON SCHEMA adigunsps TO authenticated;
GRANT SELECT ON adigunsps.hardware_devices,
  adigunsps.hardware_client_heartbeats,
  adigunsps.hardware_device_state,
  adigunsps.hardware_commands,
  adigunsps.hardware_device_events
TO authenticated;

GRANT UPDATE (heartbeat_at)
  ON adigunsps.hardware_client_heartbeats TO authenticated;
GRANT INSERT, UPDATE (last_device_heartbeat_at, connection_state, fault_code, gpio_readback, updated_at)
  ON adigunsps.hardware_device_state TO authenticated;
GRANT INSERT ON adigunsps.hardware_client_heartbeats TO authenticated;
GRANT INSERT ON adigunsps.hardware_commands TO authenticated;
GRANT UPDATE (status, received_at, completed_at, result, error_code)
  ON adigunsps.hardware_commands TO authenticated;
GRANT INSERT ON adigunsps.hardware_device_events TO authenticated;

DROP POLICY IF EXISTS hardware_devices_read_owner_or_device
  ON adigunsps.hardware_devices;
CREATE POLICY hardware_devices_read_owner_or_device
  ON adigunsps.hardware_devices FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR device_auth_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS hardware_client_heartbeat_read_owner_or_device
  ON adigunsps.hardware_client_heartbeats;
CREATE POLICY hardware_client_heartbeat_read_owner_or_device
  ON adigunsps.hardware_client_heartbeats FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM adigunsps.hardware_devices d
      WHERE d.device_id = hardware_client_heartbeats.device_id
        AND d.owner_id = hardware_client_heartbeats.owner_id
        AND d.device_auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS hardware_client_heartbeat_write_owner
  ON adigunsps.hardware_client_heartbeats;
CREATE POLICY hardware_client_heartbeat_write_owner
  ON adigunsps.hardware_client_heartbeats FOR ALL TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    AND COALESCE(((SELECT auth.jwt())->>'is_anonymous')::boolean, false) = false
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND COALESCE(((SELECT auth.jwt())->>'is_anonymous')::boolean, false) = false
  );

DROP POLICY IF EXISTS hardware_device_state_read_owner_or_device
  ON adigunsps.hardware_device_state;
CREATE POLICY hardware_device_state_read_owner_or_device
  ON adigunsps.hardware_device_state FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM adigunsps.hardware_devices d
      WHERE d.device_id = hardware_device_state.device_id
        AND d.owner_id = hardware_device_state.owner_id
        AND d.device_auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS hardware_device_state_write_device
  ON adigunsps.hardware_device_state;
CREATE POLICY hardware_device_state_write_device
  ON adigunsps.hardware_device_state FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM adigunsps.hardware_devices d
      WHERE d.device_id = hardware_device_state.device_id
        AND d.owner_id = hardware_device_state.owner_id
        AND d.device_auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM adigunsps.hardware_devices d
      WHERE d.device_id = hardware_device_state.device_id
        AND d.owner_id = hardware_device_state.owner_id
        AND d.device_auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS hardware_commands_read_owner_or_device
  ON adigunsps.hardware_commands;
CREATE POLICY hardware_commands_read_owner_or_device
  ON adigunsps.hardware_commands FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM adigunsps.hardware_devices d
      WHERE d.device_id = hardware_commands.device_id
        AND d.owner_id = hardware_commands.owner_id
        AND d.device_auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS hardware_commands_insert_owner
  ON adigunsps.hardware_commands;
CREATE POLICY hardware_commands_insert_owner
  ON adigunsps.hardware_commands FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status = 'queued'
    AND expires_at > now()
    AND COALESCE(((SELECT auth.jwt())->>'is_anonymous')::boolean, false) = false
    AND EXISTS (
      SELECT 1
      FROM adigunsps.hardware_devices d
      JOIN adigunsps.hardware_device_state s
        ON s.device_id = d.device_id AND s.owner_id = d.owner_id
      JOIN adigunsps.hardware_client_heartbeats h
        ON h.device_id = d.device_id AND h.owner_id = d.owner_id
      WHERE d.device_id = hardware_commands.device_id
        AND d.owner_id = (SELECT auth.uid())
        AND d.enabled
        AND s.last_device_heartbeat_at > now() - interval '3 seconds'
        AND h.heartbeat_at > now() - interval '3 seconds'
        AND (
          (command_type = 'SYNC' AND s.connection_state = 'awaiting_sync')
          OR
          (command_type = 'SET_OUTPUTS' AND s.connection_state = 'ready')
        )
    )
  );

DROP POLICY IF EXISTS hardware_commands_update_device
  ON adigunsps.hardware_commands;
CREATE POLICY hardware_commands_update_device
  ON adigunsps.hardware_commands FOR UPDATE TO authenticated
  USING (
    status IN ('queued', 'claimed')
    AND EXISTS (
      SELECT 1 FROM adigunsps.hardware_devices d
      WHERE d.device_id = hardware_commands.device_id
        AND d.owner_id = hardware_commands.owner_id
        AND d.device_auth_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    status IN ('claimed', 'acked', 'nacked', 'fault')
    AND EXISTS (
      SELECT 1 FROM adigunsps.hardware_devices d
      WHERE d.device_id = hardware_commands.device_id
        AND d.owner_id = hardware_commands.owner_id
        AND d.device_auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS hardware_device_events_read_owner_or_device
  ON adigunsps.hardware_device_events;
CREATE POLICY hardware_device_events_read_owner_or_device
  ON adigunsps.hardware_device_events FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM adigunsps.hardware_devices d
      WHERE d.device_id = hardware_device_events.device_id
        AND d.owner_id = hardware_device_events.owner_id
        AND d.device_auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS hardware_device_events_insert_owner_or_device
  ON adigunsps.hardware_device_events;
CREATE POLICY hardware_device_events_insert_owner_or_device
  ON adigunsps.hardware_device_events FOR INSERT TO authenticated
  WITH CHECK (
    (owner_id = (SELECT auth.uid())
      AND COALESCE(((SELECT auth.jwt())->>'is_anonymous')::boolean, false) = false)
    OR EXISTS (
      SELECT 1 FROM adigunsps.hardware_devices d
      WHERE d.device_id = hardware_device_events.device_id
        AND d.owner_id = hardware_device_events.owner_id
        AND d.device_auth_user_id = (SELECT auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS hardware_devices_owner_idx
  ON adigunsps.hardware_devices(owner_id);
CREATE INDEX IF NOT EXISTS hardware_commands_device_queue_idx
  ON adigunsps.hardware_commands(device_id, status, expires_at);
CREATE INDEX IF NOT EXISTS hardware_commands_owner_created_idx
  ON adigunsps.hardware_commands(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hardware_events_device_created_idx
  ON adigunsps.hardware_device_events(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hardware_events_owner_created_idx
  ON adigunsps.hardware_device_events(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS hardware_events_command_idx
  ON adigunsps.hardware_device_events(command_id)
  WHERE command_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'adigunsps'
      AND tablename = 'hardware_client_heartbeats'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE adigunsps.hardware_client_heartbeats;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'adigunsps'
      AND tablename = 'hardware_device_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE adigunsps.hardware_device_state;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'adigunsps'
      AND tablename = 'hardware_commands'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE adigunsps.hardware_commands;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'adigunsps'
      AND tablename = 'hardware_device_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE adigunsps.hardware_device_events;
  END IF;
END $$;

COMMIT;