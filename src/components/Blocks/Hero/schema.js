import { addStyling } from '@plone/volto/helpers';
import config from '@plone/volto/registry';
import { v4 as uuid } from 'uuid';

import alignTopSVG from '@plone/volto/icons/move-up.svg';
import alignCenterSVG from '@plone/volto/icons/row.svg';
import alignBottomSVG from '@plone/volto/icons/move-down.svg';
import clearSVG from '@plone/volto/icons/clear.svg';

const ALIGN_INFO_MAP = {
  'has--bg--top': [alignTopSVG, 'Top'],
  'has--bg--center': [alignCenterSVG, 'Center'],
  'has--bg--bottom': [alignBottomSVG, 'Bottom'],
  '': [clearSVG, 'None'],
};

// Hero slide schema (each slide in carousel)
export const heroSlideSchema = {
  title: 'Hero Slide',
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['image', 'video', 'overlay', 'backgroundColor'],
    },
  ],
  properties: {
    image: {
      title: 'Background Image',
      widget: 'image',
    },
    video: {
      title: 'Video',
      widget: 'attachedfile',
    },
    quoted: {
      title: 'Quoted',
      type: 'boolean',
      defaultValue: false,
    },
    inverted: {
      title: 'Inverted',
      type: 'boolean',
      defaultValue: true,
    },
    overlay: {
      title: 'Image darken overlay',
      type: 'boolean',
      defaultValue: true,
    },
    backgroundColor: {
      title: 'Background color',
      widget: 'style_simple_color',
      available_colors: config.settings.available_colors,
    },
    styles: {
      title: 'Slide Styles',
      widget: 'object',
      schema: {
        title: 'Slide Style',
        fieldsets: [
          {
            id: 'default',
            title: 'Default',
            fields: [
              'backgroundColor',
              'bg',
              'alignContent',
              'textAlign',
              'overlay',
            ],
          },
        ],
        properties: {
          bg: {
            title: 'Image position',
            widget: 'align',
            actions: Object.keys(ALIGN_INFO_MAP),
            actionsInfoMap: ALIGN_INFO_MAP,
            default: 'has--bg--center',
          },
          alignContent: {
            title: 'Content align',
            choices: [
              ['start', 'Top'],
              ['center', 'Center'],
              ['end', 'Bottom'],
            ],
            default: 'center',
          },
          textAlign: {
            title: 'Text align',
            widget: 'align',
            actions: ['left', 'center', 'right'],
            default: 'left',
          },
          textVariant: {
            title: 'Text theme',
            widget: 'theme_picker',
            colors: [
              ...(config.settings && config.settings.themeColors
                ? config.settings.themeColors.map(({ value, title }) => ({
                    name: value,
                    label: title,
                  }))
                : []),
            ],
          },
          buttonVariant: {
            title: 'Button theme',
            widget: 'theme_picker',
            colors: [
              ...(config.settings && config.settings.themeColors
                ? config.settings.themeColors.map(({ value, title }) => ({
                    name: value,
                    label: title,
                  }))
                : []),
            ],
          },
          buttonAlign: {
            title: 'Button align',
            widget: 'align',
            actions: ['left', 'center', 'right'],
            default: 'left',
          },
          overlay: {
            title: 'Image darken overlay',
            type: 'boolean',
            defaultValue: true,
          },
        },
        required: [],
      },
    },
  },
  required: [],
};

export const HeroBlockSchema = ({ data, activeObject, setActiveObject }) => {
  return {
    title: 'Hero',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          'fullWidth',
          'fullHeight',
          ...(!data?.fullHeight ? ['height'] : []),

          'overlay',
          'isCarousel',
          ...(!data?.isCarousel ? ['image', 'video'] : []),
          ...(data?.isCarousel ? ['slides', 'autoPlay', 'autoPlaySpeed'] : []),
        ],
      },
      {
        id: 'copyright',
        title: 'Copyright',
        fields: ['copyright', 'copyrightIcon', 'copyrightPosition'],
      },
    ],
    properties: {
      isCarousel: {
        title: 'Enable Carousel',
        type: 'boolean',
        defaultValue: false,
      },
      fullWidth: {
        title: 'Full width',
        type: 'boolean',
        defaultValue: true,
      },
      fullHeight: {
        title: 'Full height',
        type: 'boolean',
        defaultValue: true,
      },
      quoted: {
        title: 'Quoted',
        type: 'boolean',
        defaultValue: false,
      },
      spaced: {
        title: 'Spaced',
        type: 'boolean',
        defaultValue: false,
      },
      inverted: {
        title: 'Inverted',
        type: 'boolean',
        defaultValue: true,
      },
      buttonLabel: {
        title: 'Button label',
        widget: 'textarea',
      },
      buttonLink: {
        title: 'Button link',
        widget: 'url',
      },
      overlay: {
        title: 'Image darken overlay',
        type: 'boolean',
        defaultValue: true,
      },
      image: {
        title: 'Image',
        widget: 'image',
      },
      video: {
        title: 'Video',
        widget: 'attachedfile',
      },
      copyright: {
        title: 'Text',
      },
      copyrightIcon: {
        title: 'Icon',
        description: (
          <>
            Ex. ri-copyright-line. See{' '}
            <a target="_blank" rel="noopener" href="https://remixicon.com/">
              Remix Icon set
            </a>
          </>
        ),
        default: 'ri-copyright-line',
      },
      copyrightPosition: {
        title: 'Align',
        widget: 'align',
        actions: ['left', 'right'],
        default: 'left',
      },
      height: {
        title: 'Height',
        description:
          'Use CSS numeric dimmension (ex: 100px or 20vh). ' +
          'Images cannnot be made smaller than min-height.',
      },
      isCarousel: {
        title: 'Enable Carousel',
        type: 'boolean',
        defaultValue: false,
      },
      autoPlay: {
        title: 'Auto Play',
        type: 'boolean',
        defaultValue: false,
      },
      autoPlaySpeed: {
        title: 'Auto Play Speed (ms)',
        description:
          'Delay between slides in milliseconds (e.g., 5000 for 5 seconds)',
        type: 'number',
        minimum: 1000,
        defaultValue: 5000,
      },
      showDots: {
        title: 'Show Dots',
        type: 'boolean',
        defaultValue: true,
      },
      showArrows: {
        title: 'Show Arrows',
        type: 'boolean',
        defaultValue: true,
      },
      slides: {
        widget: 'object_list',
        title: 'Hero Slides',
        schema: heroSlideSchema,
        activeObject: activeObject,
        setActiveObject: setActiveObject,
        default: [{ '@id': uuid() }],
      },
    },
    required: [],
  };
};
