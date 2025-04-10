-- ✅ 학급 (클래스)
create table if not exists classes (
  class_id uuid primary key default gen_random_uuid(),
  name text not null
);

-- ✅ 주제 (토픽)
create table if not exists topics (
  topic_id uuid primary key default gen_random_uuid(),
  title text not null,
  system_prompt text,
  rubric_prompt text,
  class_id uuid references classes(class_id),
  created_at timestamptz default now()
);

-- ✅ 채팅방 (방)
create table if not exists rooms (
  room_id uuid primary key default gen_random_uuid(),
  title text not null,
  topic_id uuid references topics(topic_id),
  class_id uuid references classes(class_id),
  created_at timestamptz default now()
);

-- ✅ 메시지
create table if not exists messages (
  message_id bigserial primary key,
  room_id uuid references rooms(room_id),
  sender_id text, -- "s01", "gpt" 등
  message text,
  role text check (role in ('user', 'assistant')),
  timestamp timestamptz default now()
);

-- ✅ 학생 목록 (로그인 용도)
create table if not exists students (
  student_id text primary key,
  password text not null,
  name text,
  class_id uuid references classes(class_id)
);