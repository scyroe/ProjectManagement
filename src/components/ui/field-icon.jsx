import {
  AlignLeft,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Folder,
  Hash,
  ListFilter,
  LockKeyhole,
  Mail,
  Phone,
  Repeat2,
  Search,
  Tag,
  TextCursorInput,
  UserRound,
} from 'lucide-react';

const fieldIcons = [
  { pattern: /search|query/, icon: Search },
  { pattern: /workspace/, icon: BriefcaseBusiness },
  { pattern: /email|mail/, icon: Mail },
  { pattern: /password|secret/, icon: LockKeyhole },
  { pattern: /phone|tel/, icon: Phone },
  { pattern: /date|calendar|due|start/, icon: CalendarDays },
  { pattern: /budget|price|cost|amount|salary/, icon: CircleDollarSign },
  {
    pattern: /client|contact|assignee|owner|user|member|profile/,
    icon: UserRound,
  },
  { pattern: /project|folder/, icon: Folder },
  { pattern: /repeat|frequency/, icon: Repeat2 },
  { pattern: /priority|status|filter|template/, icon: ListFilter },
  { pattern: /code|number|hours|count|duration|week|day/, icon: Hash },
  { pattern: /description|notes|comment/, icon: AlignLeft },
  { pattern: /title|name|task/, icon: FileText },
  { pattern: /category|tag|type/, icon: Tag },
];

function getFieldIcon({ id, name, placeholder, type } = {}) {
  if (type === 'search') return Search;
  if (type === 'email') return Mail;
  if (type === 'password') return LockKeyhole;
  if (type === 'date' || type === 'datetime-local' || type === 'time')
    return CalendarDays;
  if (type === 'tel') return Phone;
  if (type === 'number') {
    const field =
      `${id ?? ''} ${name ?? ''} ${placeholder ?? ''}`.toLowerCase();
    return /budget|price|cost|amount|salary/.test(field)
      ? CircleDollarSign
      : Hash;
  }

  const field = `${id ?? ''} ${name ?? ''} ${placeholder ?? ''}`.toLowerCase();
  return (
    fieldIcons.find(({ pattern }) => pattern.test(field))?.icon ??
    TextCursorInput
  );
}

export { getFieldIcon };
