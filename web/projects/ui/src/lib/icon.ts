import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowsExchange,
  IconChevronDown,
  IconCircleCheck,
  IconCircleDashed,
  IconClock,
  IconDoorEnter,
  IconHome,
  IconHourglass,
  IconInfoCircle,
  IconLayoutDashboard,
  IconLock,
  IconMenu2,
  IconPencil,
  IconRefresh,
  IconTrophy,
  IconUsers,
  IconWifiOff,
  IconWorld,
  IconX,
  TablerIconComponent,
} from '@tabler/icons-angular';

/** The icons Herald uses. Only ui imports Tabler; a new icon is added here. */
const icons = {
  'alert-circle': IconAlertCircle,
  'alert-triangle': IconAlertTriangle,
  'arrow-left': IconArrowLeft,
  'arrows-exchange': IconArrowsExchange,
  'chevron-down': IconChevronDown,
  'circle-check': IconCircleCheck,
  'circle-dashed': IconCircleDashed,
  clock: IconClock,
  'door-enter': IconDoorEnter,
  home: IconHome,
  hourglass: IconHourglass,
  'info-circle': IconInfoCircle,
  'layout-dashboard': IconLayoutDashboard,
  lock: IconLock,
  menu: IconMenu2,
  pencil: IconPencil,
  refresh: IconRefresh,
  trophy: IconTrophy,
  users: IconUsers,
  'wifi-off': IconWifiOff,
  world: IconWorld,
  x: IconX,
} as const;

export type IconName = keyof typeof icons;

/** Visual direction §4: 20 px for controls, 24 px for navigation, 16 px for compact metadata, 32 px above an empty panel's heading. */
const sizes = { control: 20, navigation: 24, metadata: 16, empty: 32 } as const;
export type IconSize = keyof typeof sizes;

/**
 * A Tabler outline icon. Decorative unless it has a label; an icon-only action names itself
 * on its button instead.
 */
@Component({
  selector: 'herald-icon',
  imports: [TablerIconComponent],
  // data-icon names the icon for tests, which find decorative icons beside their text.
  host: { class: 'herald-icon', style: 'display: inline-flex; flex: none', '[attr.data-icon]': 'name()' },
  // Tabler appends its SVG imperatively, so hydration would keep the server's SVG and add a second one;
  // skipping hydration for this leaf replaces it instead.
  template: `<tabler-icon ngSkipHydration [icon]="icon()" [size]="pixels()" [stroke]="1.75" [svgAttributes]="attributes()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>('control');
  /** Only for an icon that carries meaning on its own. */
  readonly label = input<string>();

  protected readonly icon = computed(() => icons[this.name()]);
  protected readonly pixels = computed(() => sizes[this.size()]);
  protected readonly attributes = computed(() => {
    const label = this.label();
    return label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true', focusable: 'false' };
  });
}
