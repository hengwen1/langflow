import ShadTooltip from "@langflow/components/common/shadTooltipComponent";
import { Play } from "lucide-react";

const PlaygroundButton = ({disable}:{disable:boolean}) => {
  const PlayIcon = () => (
    <Play className="h-4 w-4 transition-all" />
  );

  const ButtonLabel = () => <span className="hidden md:block">Playground</span>;

  const ActiveButton = () => (
    <div
      data-testid="playground-btn-flow-io"
      className="playground-btn-flow-toolbar hover:bg-accent"
    >
      <PlayIcon />
      <ButtonLabel />
    </div>
  );

  const DisabledButton = () => (
    <div
      className="playground-btn-flow-toolbar cursor-not-allowed text-muted-foreground duration-150"
      data-testid="playground-btn-flow"
    >
      <PlayIcon />
      <ButtonLabel />
    </div>
  );

  return disable ? (
    <ShadTooltip content="Add a Chat Input or Chat Output to use the playground">
      <div>
        <DisabledButton />
      </div>
    </ShadTooltip>
  ) : (
    <ActiveButton />
  );
};

export default PlaygroundButton;