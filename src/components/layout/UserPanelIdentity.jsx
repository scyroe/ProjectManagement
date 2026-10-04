import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function UserPanelIdentity({
  email,
  profile,
  syncStatusLabel,
  syncStatusTone,
  t,
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
      <Avatar size="lg">
        <AvatarFallback>
          {(profile?.display_name ?? email ?? '?').slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {profile?.display_name ?? t.memberFallback}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {email ?? profile?.username}
        </p>
        <p
          className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
          aria-live="polite"
        >
          <span className={`size-1.5 rounded-full ${syncStatusTone}`} />
          {syncStatusLabel}
        </p>
      </div>
    </div>
  );
}

export default UserPanelIdentity;
