import { LayoutDashboard } from 'lucide-react';
import {
  Frame,
  FrameDescription,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { useStrings } from '@/lib/i18n';

const EmptyPage = ({ route }) => {
  const strings = useStrings();
  const Icon = route?.icon ?? LayoutDashboard;
  const label = route?.id ? strings.routes[route.id] : undefined;

  return (
    <Frame className="min-h-[28rem]" stacked>
      <FramePanel className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
        <FrameTitle className="text-lg">{label}</FrameTitle>
        <FrameDescription className="mt-1 max-w-sm">
          This workspace is ready for the {label?.toLowerCase()}{' '}
          {strings.layout.emptyPage.descriptionSuffix}
        </FrameDescription>
      </FramePanel>
    </Frame>
  );
};

export default EmptyPage;
