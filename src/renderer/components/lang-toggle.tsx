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

  function onValueChange(value: readonly string[]) {
    const newLang = value[0];
    if (newLang) {
      setAppLanguage(newLang, i18n);
    }
  }

  return (
    <ToggleGroup
      multiple={false}
      onValueChange={onValueChange}
      value={[currentLang]}
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
