import NodeDialog from "@/CustomNodes/GenericNode/components/NodeDialogComponent";
import { PopoverAnchor } from "@radix-ui/react-popover";
import Fuse from "fuse.js";
import { cloneDeep } from "lodash";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { DropDownComponent } from "../../../types/components";
import { cn, formatName, formatPlaceholderName } from "../../../utils/utils";
import { default as ForwardedIconComponent } from "../../common/genericIconComponent";
import ShadTooltip from "../../common/shadTooltipComponent";
import { Button } from "../../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverContentWithoutPortal,
  PopoverTrigger,
} from "../../ui/popover";

export default function Dropdown({
  disabled,
  isLoading,
  value,
  options,
  optionsMetaData,
  combobox,
  onSelect,
  editNode = false,
  id = "",
  children,
  name,
  dialogInputs,
}: DropDownComponent): JSX.Element {
  const placeholderName = name
    ? formatPlaceholderName(name)
    : "Choose an option...";

  const { firstWord } = formatName(name);

  const [open, setOpen] = useState(children ? true : false);
  const [openDialog, setOpenDialog] = useState(false);

  const refButton = useRef<HTMLButtonElement>(null);

  const PopoverContentDropdown =
    children || editNode ? PopoverContent : PopoverContentWithoutPortal;

  const [customValue, setCustomValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);

  const fuse = new Fuse(options, { keys: ["name", "value"] });

  const searchRoleByTerm = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const searchValues = fuse.search(value);
    const filtered = searchValues.map((search) => search.item);
    if (!filtered.includes(value) && combobox && value) filtered.push(value);
    setFilteredOptions(value ? filtered : options);
    setCustomValue(value);
  };

  useEffect(() => {
    if (disabled && value !== "") {
      onSelect("", undefined, true);
    }
  }, [disabled]);

  useEffect(() => {
    if (open) {
      const filtered = cloneDeep(options);
      if (customValue === value && value && combobox) {
        filtered.push(customValue);
      }
      setFilteredOptions(filtered);
    }
  }, [open]);

  const renderTriggerButton = () => (
    <PopoverTrigger asChild>
      <Button
        disabled={disabled}
        variant="primary"
        size="xs"
        role="combobox"
        ref={refButton}
        aria-expanded={open}
        data-testid={id}
        className={cn(
          editNode
            ? "dropdown-component-outline input-edit-node"
            : "dropdown-component-false-outline py-2",
          "w-full justify-between font-normal",
        )}
      >
        <span
          className="flex items-center gap-2 truncate"
          data-testid={`value-dropdown-${id}`}
        >
          {optionsMetaData?.[
            filteredOptions.findIndex((option) => option === value)
          ]?.icon && (
            <ForwardedIconComponent
              name={
                optionsMetaData[
                  filteredOptions.findIndex((option) => option === value)
                ].icon
              }
              className="h-4 w-4"
            />
          )}
          {value &&
          value !== "" &&
          filteredOptions.find((option) => option === value)
            ? filteredOptions.find((option) => option === value)
            : placeholderName}
        </span>
        <ForwardedIconComponent
          name="ChevronsUpDown"
          className={cn(
            "ml-2 h-4 w-4 shrink-0 text-foreground",
            disabled
              ? "hover:text-placeholder-foreground"
              : "hover:text-foreground",
          )}
        />
      </Button>
    </PopoverTrigger>
  );

  const renderSearchInput = () => (
    <div className="flex items-center border-b px-3">
      <ForwardedIconComponent
        name="search"
        className="mr-2 h-4 w-4 shrink-0 opacity-50"
      />
      <input
        onChange={searchRoleByTerm}
        placeholder="Search options..."
        className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        autoComplete="off"
      />
    </div>
  );

  const renderOptionsList = () => (
    <CommandList>
      <CommandEmpty>No values found.</CommandEmpty>
      <CommandGroup defaultChecked={false}>
        {filteredOptions?.map((option, index) => (
          <div>
            <CommandItem
              value={option}
              onSelect={(currentValue) => {
                onSelect(currentValue);
                setOpen(false);
              }}
              className="items-center overflow-hidden truncate hover:cursor-pointer"
              data-testid={`${option}-${index}-option`}
            >
              {customValue === option && (
                <span className="text-muted-foreground">Text:&nbsp;</span>
              )}
              <span className="truncate">{option}</span>
              <ForwardedIconComponent
                name="Check"
                className={cn(
                  "ml-auto h-4 w-4 shrink-0 text-primary",
                  value === option ? "opacity-100" : "opacity-0",
                )}
              />
            </CommandItem>
          </div>
        ))}
      </CommandGroup>
    </CommandList>
  );

  const renderCreateOptionDialog = () => (
    <CommandGroup className="flex flex-col">
      <CommandItem
        className="flex items-center justify-start gap-2 truncate py-3 text-xs font-semibold text-muted-foreground"
        onSelect={() => setOpenDialog(true)}
      >
        <div className="flex items-center gap-2 pl-1">
          <ForwardedIconComponent
            name="Plus"
            className="h-3 w-3 text-primary"
          />
          {`New ${firstWord}`}
        </div>
      </CommandItem>
      <CommandItem
        className="flex items-center justify-start gap-2 truncate py-3 text-xs font-semibold text-muted-foreground"
        onSelect={() => {
          setOpenDialog(true); // TODO: Implement refresh list
        }}
      >
        <div className="flex items-center gap-2 pl-1">
          <ForwardedIconComponent
            name="RefreshCcw"
            className="h-3 w-3 text-primary"
          />
          Refresh list
        </div>
      </CommandItem>
      <NodeDialog
        open={openDialog}
        dialogInputs={dialogInputs}
        onClose={() => setOpenDialog(false)}
        content={<div>Content</div>}
      />
    </CommandGroup>
  );

  const renderIconOptionsList = () => (
    <CommandList>
      <CommandEmpty>No values found.</CommandEmpty>
      <CommandGroup defaultChecked={false}>
        {filteredOptions?.map((option, index) => (
          <ShadTooltip key={index} delayDuration={700} content={option}>
            <div>
              <CommandItem
                value={option}
                onSelect={(currentValue) => {
                  onSelect(currentValue);
                  setOpen(false);
                }}
                className="items-center"
                data-testid={`${option}-${index}-option`}
              >
                <div className="flex w-full items-center gap-2">
                  {optionsMetaData?.[index]?.icon ? (
                    <ForwardedIconComponent
                      name={optionsMetaData?.[index]?.icon}
                      className="h-4 w-4 shrink-0 text-primary"
                    />
                  ) : null}
                  <div className="flex flex-col truncate pl-2">
                    <div className="truncate">{option}</div>
                    <div className="flex w-full items-center text-muted-foreground">
                      {Object.entries(optionsMetaData?.[index] || {}).map(
                        ([key, value], i, arr) => (
                          <div
                            key={key}
                            className={cn("flex items-center", {
                              truncate: i === arr.length - 1,
                            })}
                          >
                            {i > 0 && (
                              <ForwardedIconComponent
                                name="Circle"
                                className="mx-1 h-1 w-1 overflow-visible fill-muted-foreground"
                              />
                            )}
                            <div
                              className={cn("text-xs", {
                                truncate: i === arr.length - 1,
                              })}
                            >{`${String(value)} ${key}`}</div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </CommandItem>
            </div>
          </ShadTooltip>
        ))}
      </CommandGroup>
      <CommandSeparator />
      {renderCreateOptionDialog()}
    </CommandList>
  );

  const renderPopoverContent = () => (
    <PopoverContentDropdown
      side="bottom"
      avoidCollisions={!!children}
      className="noflow nowheel nopan nodelete nodrag p-0"
      style={
        children ? {} : { minWidth: refButton?.current?.clientWidth ?? "200px" }
      }
    >
      <Command>
        {renderSearchInput()}
        {dialogInputs ? renderIconOptionsList() : renderOptionsList()}
      </Command>
    </PopoverContentDropdown>
  );

  if (Object.keys(options).length === 0 && !combobox) {
    return isLoading ? (
      <div>
        <span className="text-sm italic">Loading...</span>
      </div>
    ) : (
      <div>
        <span className="text-sm italic">
          No parameters are available for display.
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={children ? () => {} : setOpen}>
      {children ? (
        <PopoverAnchor>{children}</PopoverAnchor>
      ) : (
        renderTriggerButton()
      )}
      {renderPopoverContent()}
    </Popover>
  );
}
