/**
 * Language selection toggle group
 */
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '@/actions/language';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/renderer/components/ui/toggle-group';
import langs from '@/renderer/lib/langs';

export default function LangToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  function onValueChange(value: string) {
    setAppLanguage(value, i18n);
  }

  return (
    <ToggleGroup
      type="single"
      onValueChange={onValueChange}
      value={currentLang}
    >
      {langs.map((lang) => (
        <ToggleGroupItem
          key={lang.key}
          value={lang.key}
          variant="outline"
          size="lg"
        >
          {`${lang.prefix}`}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
