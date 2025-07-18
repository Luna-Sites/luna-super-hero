import installHeroBlock from 'volto-super-hero/components/Blocks/Hero';
import AttachedFileWidget from '@eeacms/volto-object-widget/Widget/AttachedFileWidget';

const applyConfig = (config) => {
  config.widgets.widget.attachedfile = AttachedFileWidget;
  return [installHeroBlock].reduce((acc, apply) => apply(acc), config);
};

export default applyConfig;
