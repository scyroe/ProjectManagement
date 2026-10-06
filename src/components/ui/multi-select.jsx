import VirtualSelect from '@/components/ui/virtual-select';

function MultiSelect({ ariaLabel, searchLabel, ...props }) {
  const label = ariaLabel ?? props.placeholder;

  return (
    <VirtualSelect
      {...props}
      ariaLabel={label}
      searchLabel={searchLabel ?? label}
      multiple
    />
  );
}

export default MultiSelect;
