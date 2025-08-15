import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Controller, useFormContext } from 'react-hook-form';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  name: string;
  label: string;
  options: Option[];
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  name,
  label,
  options,
  error,
  placeholder,
  disabled,
}) => {
  const { control, setValue, watch } = useFormContext();
  const selectedValues = watch(name) || [];
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  // Ensure selectedValues is always an array of strings
  const currentSelected = Array.isArray(selectedValues) ? selectedValues : [];

  const handleSelectChange = (selectedOptionValues: string[]) => {
    setValue(name, selectedOptionValues, { shouldValidate: true });
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <Listbox
            value={currentSelected}
            onChange={handleSelectChange}
            multiple
            disabled={disabled}
          >
            {({ open }) => (
              <>
                <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </Listbox.Label>
                <div className="relative mt-1">
                  <Listbox.Button
                    ref={buttonRef}
                    className={classNames(
                      'relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-1 sm:text-base',
                      error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                      disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    )}
                    onClick={() => {
                      if (buttonRef.current) {
                        setButtonRect(buttonRef.current.getBoundingClientRect());
                      }
                    }}
                  >
                    <span className="block truncate">
                      {currentSelected.length > 0
                        ? currentSelected
                            .map((val) => options.find((opt) => opt.value === val)?.label)
                            .filter(Boolean)
                            .join(', ')
                        : placeholder || `Select ${label.toLowerCase()}...`}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>

                  {open && buttonRect && ReactDOM.createPortal(
                    <Transition
                      show={open}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options
                        static
                        className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                        style={{
                          top: buttonRect.bottom + window.scrollY,
                          left: buttonRect.left + window.scrollX,
                          width: buttonRect.width,
                        }}
                      >
                        {options.map((option) => (
                          <Listbox.Option
                            key={option.value}
                            className={({ active }) =>
                              classNames(
                                active ? 'text-white bg-blue-600' : 'text-gray-900',
                                'relative cursor-default select-none py-2 pl-8 pr-4'
                              )
                            }
                            value={option.value}
                          >
                            {({ selected, active }) => (
                              <span
                                className={classNames(
                                  'block truncate',
                                  selected ? 'font-semibold' : 'font-normal'
                                )}
                              >
                                {option.label}
                                {selected ? (
                                  <span
                                    className={classNames(
                                      active ? 'text-white' : 'text-blue-600',
                                      'absolute inset-y-0 left-0 flex items-center pl-1.5'
                                    )}
                                  >
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                ) : null}
                              </span>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>,
                    document.body
                  )}
                </div>
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
              </>
            )}
          </Listbox>
        </div>
      )}
    />
  );
};
