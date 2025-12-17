/**
 * Radio Group Component
 * Reusable radio button group
 */

/**
 * Radio option configuration
 */
export interface RadioOption {
  value: string;
  label: string;
}

/**
 * Render a radio group
 * @param options Radio options
 * @param selectedValue Currently selected value
 * @param name Group name for radio inputs
 * @returns HTML string
 */
export function renderRadioGroup(
  options: RadioOption[],
  selectedValue: string | null,
  name: string
): string {
  return options
    .map((option) => {
      const isSelected = option.value === selectedValue;
      const selectedClass = isSelected ? " selected" : "";
      const checkedAttr = isSelected ? " checked" : "";

      return `
      <label class="radio-option${selectedClass}">
        <input type="radio" name="${name}" value="${option.value}"${checkedAttr}>
        <span>${option.label}</span>
      </label>
    `;
    })
    .join("");
}

/**
 * Setup radio group change handlers
 * @param containerId Container element ID
 * @param onChange Callback when selection changes
 */
export function setupRadioGroupHandlers(
  containerId: string,
  onChange: (value: string) => void
): void {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement;

    if (target.type === "radio") {
      // Update visual selection state
      container.querySelectorAll(".radio-option").forEach((option) => {
        option.classList.remove("selected");
      });

      const selectedOption = target.closest(".radio-option");
      if (selectedOption) {
        selectedOption.classList.add("selected");
      }

      onChange(target.value);
    }
  });
}

/**
 * Update radio group selection
 * @param containerId Container element ID
 * @param value Value to select
 */
export function setRadioGroupValue(containerId: string, value: string): void {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.querySelectorAll(".radio-option").forEach((option) => {
    const input = option.querySelector("input") as HTMLInputElement;
    const isSelected = input?.value === value;

    option.classList.toggle("selected", isSelected);
    if (input) {
      input.checked = isSelected;
    }
  });
}

/**
 * Get current radio group value
 * @param containerId Container element ID
 * @returns Selected value or null
 */
export function getRadioGroupValue(containerId: string): string | null {
  const container = document.getElementById(containerId);

  if (!container) return null;

  const checkedInput = container.querySelector(
    'input[type="radio"]:checked'
  ) as HTMLInputElement;
  return checkedInput?.value ?? null;
}
