/**
 * Tabs Component
 * Reusable tabbed interface
 */

/**
 * Tab configuration
 */
export interface TabConfig {
  id: string;
  label: string;
  content: string;
}

/**
 * Render tab headers
 * @param tabs Tab configurations
 * @param activeId Currently active tab ID
 * @param onTabClick Click handler
 * @returns HTML string
 */
export function renderTabHeaders(
  tabs: TabConfig[],
  activeId: string | null
): string {
  return tabs
    .map((tab) => {
      const activeClass = tab.id === activeId ? " active" : "";
      return `<button class="tab-btn${activeClass}" data-tab-id="${tab.id}">${tab.label}</button>`;
    })
    .join("");
}

/**
 * Render tab panels
 * @param tabs Tab configurations
 * @param activeId Currently active tab ID
 * @returns HTML string
 */
export function renderTabPanels(
  tabs: TabConfig[],
  activeId: string | null
): string {
  return tabs
    .map((tab) => {
      const activeClass = tab.id === activeId ? " active" : "";
      return `<div class="tab-panel${activeClass}" data-tab-panel="${tab.id}">${tab.content}</div>`;
    })
    .join("");
}

/**
 * Setup tab click handlers
 * @param headerContainerId Header container element ID
 * @param contentContainerId Content container element ID
 * @param onTabChange Callback when tab changes
 */
export function setupTabHandlers(
  headerContainerId: string,
  contentContainerId: string,
  onTabChange: (tabId: string) => void
): void {
  const headerContainer = document.getElementById(headerContainerId);

  if (!headerContainer) return;

  headerContainer.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const tabId = target.dataset.tabId;

    if (tabId) {
      onTabChange(tabId);
    }
  });
}

/**
 * Switch to a specific tab
 * @param tabId Tab ID to activate
 * @param headerContainerId Header container element ID
 * @param contentContainerId Content container element ID
 */
export function switchTab(
  tabId: string,
  headerContainerId: string,
  contentContainerId: string
): void {
  const headerContainer = document.getElementById(headerContainerId);
  const contentContainer = document.getElementById(contentContainerId);

  if (!headerContainer || !contentContainer) return;

  // Update header buttons
  headerContainer.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-tab-id") === tabId);
  });

  // Update content panels
  contentContainer.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle(
      "active",
      panel.getAttribute("data-tab-panel") === tabId
    );
  });
}

/**
 * Render a complete tabbed interface
 * @param tabs Tab configurations
 * @param activeId Initially active tab
 * @param headerId Header container ID
 * @param contentId Content container ID
 */
export function renderTabs(
  tabs: TabConfig[],
  activeId: string | null,
  headerId: string,
  contentId: string
): void {
  const headerContainer = document.getElementById(headerId);
  const contentContainer = document.getElementById(contentId);

  if (!headerContainer || !contentContainer) return;

  // Use first tab if no active specified
  const effectiveActiveId = activeId ?? tabs[0]?.id ?? null;

  headerContainer.innerHTML = renderTabHeaders(tabs, effectiveActiveId);
  contentContainer.innerHTML = renderTabPanels(tabs, effectiveActiveId);
}
