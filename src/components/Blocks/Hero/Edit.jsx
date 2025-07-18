import React, { useState, useEffect, useRef } from 'react';
import cx from 'classnames';
import isFunction from 'lodash/isFunction';
import { Icon } from 'semantic-ui-react';
import config from '@plone/volto/registry';
import { BlocksForm } from '@plone/volto/components';
import EditBlockWrapper from '@plone/volto/components/manage/Blocks/Block/EditBlockWrapper';
import { v4 as uuid } from 'uuid';
import 'volto-super-hero/components/Blocks/Hero/edit.css';

import { isEmpty } from 'lodash';
import {
  BlockDataForm,
  SidebarPortal,
  UniversalLink,
  BlocksToolbar,
} from '@plone/volto/components';
import { BodyClass } from '@plone/volto/helpers';

import { getFieldURL } from 'volto-super-hero/helpers';
import { HeroBlockSchema } from './schema';
import Copyright from './Copyright';
import Hero from './Hero';

const Metadata = ({ buttonLabel, buttonLink, inverted, styles, ...props }) => {
  const finalButtonLink = getFieldURL(buttonLink); // Use passed buttonLink
  const { buttonVariant } = styles || {};

  return buttonLabel ? (
    <UniversalLink
      className={cx('ui button', buttonVariant, { inverted })}
      href={finalButtonLink || ''}
    >
      {buttonLabel}
    </UniversalLink>
  ) : (
    ''
  );
};

export default function Edit(props) {
  const {
    data = {},
    block = null,
    selected,
    properties,
    onChangeBlock,
    onChangeField, // This onChangeField is for top-level block properties
    pathname,
    metadata = null,
    setSidebarTab,
  } = props;

  const [slideIndex, setSlideIndex] = useState(0); // State for current slide index in carousel
  // activeBlock stores the ID of the block selected *within* the BlocksForm (similar to tabs block)
  const [activeBlock, setActiveBlock] = useState(null);
  const [multiSelected, setMultiSelected] = useState([]);
  const initialMountRef = useRef(true); // To run initialization logic only once on initial render or when `isCarousel` changes
  const blocksState = useRef({}); // Temporary state for blocks changes similar to tabs block

  const { copyright, copyrightIcon, copyrightPosition, isCarousel } = data;

  const copyrightPrefix = config.blocks.blocksConfig.hero.copyrightPrefix || '';
  const schema = React.useMemo(() => {
    if (isFunction(HeroBlockSchema)) {
      return HeroBlockSchema(props);
    }
    return HeroBlockSchema;
  }, [props]);

  // Unified Initialization and Migration useEffect
  useEffect(() => {
    // This effect runs on initial mount, when `data.isCarousel` changes, or when slides are added.
    // It's crucial for transforming the block's data structure
    // based on whether it's a single block or a carousel.
    if (initialMountRef.current || data.isCarousel !== isCarousel) {
      let updatedData = { ...data };
      let changed = false;

      // Apply common default properties to the main block.
      // These defaults are merged to avoid overwriting existing explicit values.
      const defaultCommonProps = {
        fullWidth: updatedData.fullWidth ?? true,
        fullHeight: updatedData.fullHeight ?? true,
        inverted: updatedData.inverted ?? true,
        overlay: updatedData.overlay ?? true,
        copyrightIcon: updatedData.copyrightIcon ?? 'ri-copyright-line',
        styles: {
          alignContent: updatedData.styles?.alignContent ?? 'center',
          ...updatedData.styles, // Preserve existing styles
        },
      };
      updatedData = { ...updatedData, ...defaultCommonProps };

      // Migrate `data.text` if it exists (legacy field) to a block-compatible format.
      // This will be used as initial content for the default slate block.
      const legacyTextContent = updatedData.text || [
        { type: 'h2', children: [{ text: '' }] },
      ];
      if (updatedData.text !== undefined) {
        delete updatedData.text; // Remove legacy 'text' field after processing
        changed = true;
      }

      if (!isCarousel) {
        // --- Logic for Non-Carousel (Single Block) Mode ---

        // Ensure `data.data` and its `blocks` are properly initialized.
        if (!updatedData.data || isEmpty(updatedData.data.blocks)) {
          const defaultBlockId = uuid();
          updatedData.data = {
            blocks: {
              [defaultBlockId]: {
                '@type': 'slate',
                value: legacyTextContent,
                plaintext:
                  Array.isArray(legacyTextContent) &&
                  legacyTextContent.length > 0
                    ? legacyTextContent[0]?.children?.[0]?.text || ''
                    : '',
              },
            },
            blocks_layout: { items: [defaultBlockId] },
          };
          changed = true;
        }

        // Clean up 'slides' data if switching from carousel to single mode.
        if (updatedData.slides) {
          delete updatedData.slides;
          changed = true;
        }
      } else {
        // --- Logic for Carousel Mode ---

        // If no slides exist, create a default first slide.
        if (!updatedData.slides || updatedData.slides.length === 0) {
          const defaultSlideId = uuid();
          const defaultBlockId = uuid();

          const newSlide = {
            '@id': defaultSlideId,
            // Migrate top-level `image` and `styles` to the first slide
            image: updatedData.image,
            styles: updatedData.styles,
            data: {
              // This 'data' object holds blocks specific to the slide
              blocks: {
                [defaultBlockId]: {
                  '@type': 'slate',
                  value: legacyTextContent,
                  plaintext:
                    Array.isArray(legacyTextContent) &&
                    legacyTextContent.length > 0
                      ? legacyTextContent[0]?.children?.[0]?.text || ''
                      : '',
                },
              },
              blocks_layout: { items: [defaultBlockId] },
            },
          };
          updatedData.slides = [newSlide];
          setSlideIndex(0); // Set current slide to the newly created first slide
          changed = true;

          // Clear top-level `image` and `styles` as they are now slide-specific
          if (updatedData.image !== undefined) {
            updatedData.image = undefined;
            changed = true;
          }
          if (
            updatedData.styles &&
            Object.keys(updatedData.styles).length > 0
          ) {
            updatedData.styles = {}; // Reset styles if they were migrated
            changed = true;
          }
        } else {
          // Ensure all existing slides have proper internal block structures.
          // This prevents issues if slides were created without `data.blocks` (e.g., from sidebar).
          let slidesChanged = false;
          updatedData.slides = updatedData.slides.map((slide) => {
            if (!slide.data || isEmpty(slide.data.blocks)) {
              const slideDefaultBlockId = uuid();
              slidesChanged = true;
              return {
                ...slide,
                data: {
                  blocks: {
                    [slideDefaultBlockId]: {
                      '@type': 'slate',
                      value: [
                        { type: 'h2', children: [{ text: 'New Slide' }] },
                      ],
                      plaintext: 'New Slide',
                    },
                  },
                  blocks_layout: { items: [slideDefaultBlockId] },
                },
              };
            }
            return slide;
          });
          if (slidesChanged) changed = true;
        }

        // Clean up 'data' field (which held single block content) if switching to carousel mode.
        if (updatedData.data) {
          delete updatedData.data;
          changed = true;
        }
      }

      // If any changes were made to `updatedData`, commit them to the parent block.
      if (changed) {
        onChangeBlock(block, updatedData);
      }
      initialMountRef.current = false; // Mark initial mount/transformation as complete
    }
  }, [data.isCarousel, data.slides?.length, block, onChangeBlock]); // Dependency on `data.isCarousel` and slides length ensures transformation

  // Effect to reset `slideIndex` if current index is out of bounds (e.g., after slide deletion).
  useEffect(() => {
    if (isCarousel && data.slides && slideIndex >= data.slides.length) {
      setSlideIndex(Math.max(0, data.slides.length - 1));
    }
  }, [isCarousel, data.slides?.length, slideIndex]);

  // Reset blocksState when changing slides
  useEffect(() => {
    blocksState.current = {};
  }, [slideIndex]);

  // Effect to ensure all slides have proper content (especially when added from sidebar)
  useEffect(() => {
    if (isCarousel && data.slides) {
      let slidesChanged = false;
      const updatedSlides = data.slides.map((slide) => {
        if (!slide.data || isEmpty(slide.data.blocks)) {
          const slideDefaultBlockId = uuid();
          slidesChanged = true;
          return {
            ...slide,
            data: {
              blocks: {
                [slideDefaultBlockId]: {
                  '@type': 'slate',
                  value: [{ type: 'h2', children: [{ text: 'New Slide' }] }],
                  plaintext: 'New Slide',
                },
              },
              blocks_layout: { items: [slideDefaultBlockId] },
            },
          };
        }
        return slide;
      });

      if (slidesChanged) {
        onChangeBlock(block, {
          ...data,
          slides: updatedSlides,
        });
      }
    }
  }, [isCarousel, data.slides?.length, block, onChangeBlock, data.slides]);

  const onSelectBlock = (id, isMultipleSelection, event, setSelected) => {
    // Prevent event propagation to avoid triggering parent onClick handlers
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    let newMultiSelected = [];
    let selected = id;

    if (isMultipleSelection) {
      selected = null;
      // Get current blocks layout for the active slide/hero
      const currentData = isCarousel
        ? data.slides?.[slideIndex]?.data || {}
        : data.data || {};
      const blocks_layout = currentData.blocks_layout?.items || [];

      if (event?.shiftKey) {
        const anchor =
          multiSelected.length > 0
            ? blocks_layout.indexOf(multiSelected[0])
            : blocks_layout.indexOf(activeBlock);
        const focus = blocks_layout.indexOf(id);

        if (anchor === focus) {
          newMultiSelected = [id];
        } else if (focus > anchor) {
          newMultiSelected = [...blocks_layout.slice(anchor, focus + 1)];
        } else {
          newMultiSelected = [...blocks_layout.slice(focus, anchor + 1)];
        }
      }

      if ((event?.ctrlKey || event?.metaKey) && !event?.shiftKey) {
        if (multiSelected.includes(id)) {
          selected = null;
          newMultiSelected = multiSelected.filter((blockId) => blockId !== id);
        } else {
          newMultiSelected = [...(multiSelected || []), id];
        }
      }
    }

    setActiveBlock(selected);
    setMultiSelected(newMultiSelected);
  };

  // Handler for slide data changes (similar to onChangeTabData in tabs block)
  const onChangeSlideData = (id, value) => {
    const slides = data.slides || [];
    const safeSlideIndex = Math.max(0, Math.min(slideIndex, slides.length - 1));
    const currentSlide = slides[safeSlideIndex] || {};

    // Special handling of blocks and blocks_layout
    if (['blocks', 'blocks_layout'].indexOf(id) > -1) {
      blocksState.current[id] = value;
      const currentSlideData = currentSlide.data || {};

      const updatedSlides = [...slides];
      updatedSlides[safeSlideIndex] = {
        ...currentSlide,
        data: {
          ...currentSlideData,
          ...blocksState.current,
        },
      };

      onChangeBlock(block, {
        ...data,
        slides: updatedSlides,
      });
    } else {
      // For other slide properties (image, styles, etc.)
      const updatedSlides = [...slides];
      updatedSlides[safeSlideIndex] = {
        ...currentSlide,
        [id]: value,
      };
      onChangeBlock(block, {
        ...data,
        slides: updatedSlides,
      });
    }
  };

  // Renders the edit interface for a single Hero block.
  const renderSingleHeroEdit = () => {
    // Get the ID of the default internal slate block for initial selection if no other is selected.
    const internalBlockId = data.data?.blocks_layout?.items?.[0] || null;

    return (
      <div
        className="hero-edit-wrapper"
        role="presentation"
        onClick={() => {
          // When the outer wrapper is clicked, deselect any internal block
          // and select the main Hero block itself in the sidebar.
          setActiveBlock(null);
          props.onSelectBlock(block);
          setSidebarTab(1); // Switch to hero block properties
        }}
      >
        <Hero {...data}>
          <Hero.Text {...data.styles}>
            <div
              onKeyDown={(e) => {
                // Prevent Enter key from interfering with the editor's behavior.
                if (e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
            >
              <BlocksForm
                metadata={properties || metadata}
                properties={data.data || {}} // Passes the blocks and layout for the single hero
                manage={false}
                allowedBlocks={null}
                selected={selected && activeBlock}
                selectedBlock={selected && activeBlock ? activeBlock : null}
                title={data.placeholder || 'Add content'}
                onSelectBlock={onSelectBlock}
                onChangeFormData={(newFormData) => {
                  // `newFormData` contains the updated `blocks` and `blocks_layout` for the single hero.
                  onChangeBlock(block, {
                    ...data,
                    data: newFormData,
                  });
                }}
                onChangeField={(id, value) => {
                  // This `onChangeField` is for specific fields exposed by BlocksForm that are *not*
                  // part of the `blocks` or `blocks_layout` structure.
                  // For structured block content updates (like slate value), `onChangeFormData` is used.
                  // If this is used, it indicates a property of the main Hero block is being changed directly
                  // through the internal BlocksForm. It's often better to manage such fields via the main
                  // BlockDataForm in the sidebar.
                  console.warn(`[Hero Block] Unexpected onChangeField from BlocksForm for single hero block (id: ${id}). 
                  Consider if this should be handled by onChangeFormData or the main BlockDataForm.`);
                }}
                pathname={pathname}
              >
                {({ draginfo }, editBlock, blockProps) => (
                  <EditBlockWrapper
                    draginfo={draginfo}
                    blockProps={blockProps}
                    disabled={data?.disableInnerButtons}
                  >
                    {editBlock}
                  </EditBlockWrapper>
                )}
              </BlocksForm>
            </div>
          </Hero.Text>
          <Hero.Meta metaAlign={data?.styles?.buttonAlign}>
            <Metadata
              buttonLabel={data.buttonLabel}
              buttonLink={data.buttonLink}
              inverted={data.inverted}
              styles={data.styles}
            />
          </Hero.Meta>
          {copyright ? (
            <Copyright copyrightPosition={copyrightPosition}>
              <Copyright.Prefix>{copyrightPrefix}</Copyright.Prefix>
              <Copyright.Icon>
                <Icon className={copyrightIcon} />
              </Copyright.Icon>
              <Copyright.Text>{copyright}</Copyright.Text>
            </Copyright>
          ) : (
            ''
          )}
        </Hero>
      </div>
    );
  };

  // Renders the edit interface for the Hero block in carousel mode.
  const renderCarouselEdit = () => {
    const slides = data.slides || [];

    // Ensure `slideIndex` is within the valid range of slides.
    const safeSlideIndex = Math.max(0, Math.min(slideIndex, slides.length - 1));
    const currentSlide = slides[safeSlideIndex] || {};
    // Use the slide's unique ID for `@id` or fallback to index.
    const currentSlideId = currentSlide['@id'] || `slide-${safeSlideIndex}`;
    const currentSlideStyles = currentSlide.styles || {};

    // Properties to pass to the `Hero` component for rendering the *current* slide.
    const currentHeroProps = {
      image: currentSlide.image,
      video: currentSlide.video,
      backgroundColor: currentSlide.backgroundColor,
      overlay:
        currentSlide.overlay !== undefined
          ? currentSlide.overlay
          : data.overlay,
      inverted:
        currentSlide.inverted !== undefined
          ? currentSlide.inverted
          : data.inverted,
      quoted:
        currentSlide.quoted !== undefined ? currentSlide.quoted : data.quoted,
      height: currentSlide.height || data.height,
      fullWidth: data.fullWidth, // Global
      fullHeight: data.fullHeight, // Global
      spaced: data.spaced, // Global
      styles: {
        ...data.styles, // Inherit global styles from parent block (e.g., alignContent)
        ...currentSlideStyles, // Override with current slide's specific styles
      },
    };

    // The ID of the default internal slate block for the current slide, used for initial selection.
    const internalBlockIdForSlide =
      currentSlide.data?.blocks_layout?.items?.[0] || null;

    return (
      <div
        className={cx(
          'hero-carousel-edit-wrapper eea hero-block',
          data.fullHeight ? 'full-height' : '',
          data.spaced ? 'spaced' : '',
          data.fullWidth ? 'has-full-width' : '',
        )}
      >
        {/* Slide Navigation and Management Buttons */}
        <div className="hero-edit-navigation">
          {slides.length > 1 && ( // Show navigation only if more than one slide
            <>
              <button
                type="button"
                className="hero-edit-nav-btn hero-edit-prev"
                onClick={() => {
                  setSlideIndex(Math.max(0, slideIndex - 1));
                  setActiveBlock(null); // Clear internal selection on slide change
                  setMultiSelected([]);
                  blocksState.current = {}; // Reset blocks state
                }}
                disabled={slideIndex === 0}
              >
                <Icon name="chevron left" />
              </button>
              <span className="hero-edit-slide-counter">
                Slide {safeSlideIndex + 1} of {slides.length}
              </span>
              <button
                type="button"
                className="hero-edit-nav-btn hero-edit-next"
                onClick={() => {
                  setSlideIndex(Math.min(slides.length - 1, slideIndex + 1));
                  setActiveBlock(null); // Clear internal selection on slide change
                  setMultiSelected([]);
                  blocksState.current = {}; // Reset blocks state
                }}
                disabled={slideIndex === slides.length - 1}
              >
                <Icon name="chevron right" />
              </button>
            </>
          )}
          <button
            type="button"
            className="hero-edit-nav-btn hero-edit-add-slide"
            onClick={() => {
              const newSlideId = uuid();
              const newBlockId = uuid();
              const newSlide = {
                '@id': newSlideId,
                data: {
                  blocks: {
                    [newBlockId]: {
                      '@type': 'slate',
                      value: [
                        { type: 'h2', children: [{ text: 'New Slide' }] },
                      ],
                      plaintext: 'New Slide',
                    },
                  },
                  blocks_layout: { items: [newBlockId] },
                },
                image: null, // New slides start with no specific image
                styles: {}, // New slides start with empty styles
              };
              onChangeBlock(block, {
                ...data,
                slides: [...slides, newSlide],
              });
              setSlideIndex(slides.length); // Navigate to the newly added slide
              setActiveBlock(null); // Clear any previously selected internal block
              setMultiSelected([]);
              blocksState.current = {}; // Reset blocks state
            }}
          >
            <Icon name="plus" /> Add Slide
          </button>
          {slides.length > 1 && ( // Only allow removal if there's more than one slide
            <button
              type="button"
              className="hero-edit-nav-btn hero-edit-remove-slide"
              onClick={() => {
                const updatedSlides = slides.filter(
                  (_, idx) => idx !== safeSlideIndex,
                );
                onChangeBlock(block, {
                  ...data,
                  slides: updatedSlides,
                });
                // Adjust slide index if the current one was removed or it's the last one.
                if (safeSlideIndex >= updatedSlides.length) {
                  setSlideIndex(Math.max(0, updatedSlides.length - 1));
                }
                setActiveBlock(null); // Clear any selected internal block
                setMultiSelected([]);
                blocksState.current = {}; // Reset blocks state
              }}
            >
              <Icon name="trash" /> Remove Slide
            </button>
          )}
        </div>

        {/* Current Slide Edit Area (rendering the Hero component for the current slide) */}
        <div
          className="hero-edit-wrapper hero-slide-edit"
          role="presentation"
          onClick={() => {
            // When the outer wrapper for the slide is clicked, deselect any internal block
            // and select the main Hero block itself in the sidebar.
            setActiveBlock(null);
            props.onSelectBlock(block);
            setSidebarTab(1); // Switch to hero block properties
          }}
        >
          <Hero {...currentHeroProps}>
            <Hero.Text {...currentHeroProps.styles}>
              <div
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                  }
                }}
              >
                <BlocksForm
                  metadata={properties || metadata}
                  properties={currentSlide.data || {}} // This passes the blocks and layout *for this specific slide*
                  manage={false}
                  allowedBlocks={null}
                  selected={selected && activeBlock}
                  selectedBlock={selected && activeBlock ? activeBlock : null}
                  title={
                    currentSlide.placeholder ||
                    `Slide ${safeSlideIndex + 1} content`
                  }
                  onSelectBlock={onSelectBlock}
                  onChangeFormData={(newFormData) => {
                    // `newFormData` contains the updated `blocks` and `blocks_layout` for the *current slide's content*.
                    const updatedSlides = [...slides];
                    updatedSlides[safeSlideIndex] = {
                      ...currentSlide,
                      // Apply logic similar to tabs block: if newFormData has items, use it directly.
                      // Otherwise, provide an empty blocks structure.
                      data:
                        newFormData.blocks_layout.items.length > 0
                          ? newFormData // newFormData already contains { blocks, blocks_layout }
                          : { blocks: {}, blocks_layout: { items: [] } },
                    };
                    onChangeBlock(block, {
                      ...data,
                      slides: updatedSlides,
                    });
                  }}
                  onChangeField={onChangeSlideData}
                  pathname={pathname}
                >
                  {({ draginfo }, editBlock, blockProps) => (
                    <EditBlockWrapper
                      draginfo={draginfo}
                      blockProps={blockProps}
                      disabled={data?.disableInnerButtons}
                    >
                      {editBlock}
                    </EditBlockWrapper>
                  )}
                </BlocksForm>
              </div>
            </Hero.Text>
            <Hero.Meta metaAlign={currentHeroProps.styles?.buttonAlign}>
              <Metadata
                buttonLabel={data.buttonLabel} // Assuming buttonLabel/Link are global props
                buttonLink={data.buttonLink}
                inverted={currentHeroProps.inverted}
                styles={currentHeroProps.styles}
              />
            </Hero.Meta>
            {copyright ? (
              <Copyright copyrightPosition={copyrightPosition}>
                <Copyright.Prefix>{copyrightPrefix}</Copyright.Prefix>
                <Copyright.Icon>
                  <Icon className={copyrightIcon} />
                </Copyright.Icon>
                <Copyright.Text>{copyright}</Copyright.Text>
              </Copyright>
            ) : (
              ''
            )}
          </Hero>
        </div>
      </div>
    );
  };
  return (
    <>
      <BodyClass className="with-hero-block" />
      {/* Conditionally render single or carousel edit mode */}
      {isCarousel ? renderCarouselEdit() : renderSingleHeroEdit()}

      {/* BlocksToolbar for managing selected internal blocks - similar to tabs block */}
      {selected && activeBlock && (
        <BlocksToolbar
          formData={(() => {
            // Get the data of the currently selected block
            const currentData = isCarousel
              ? data.slides?.[slideIndex]?.data || {}
              : data.data || {};
            const blocks = currentData.blocks || {};
            return blocks[activeBlock] || {};
          })()}
          selectedBlock={activeBlock}
          selectedBlocks={multiSelected}
          onChangeBlocks={(newBlockData) => {
            if (isCarousel) {
              const updatedSlides = [...(data.slides || [])];
              const safeSlideIndex = Math.max(
                0,
                Math.min(slideIndex, updatedSlides.length - 1),
              );
              updatedSlides[safeSlideIndex] = {
                ...(updatedSlides[safeSlideIndex] || {}),
                data: newBlockData,
              };
              onChangeBlock(block, {
                ...data,
                slides: updatedSlides,
              });
            } else {
              onChangeBlock(block, {
                ...data,
                data: newBlockData,
              });
            }
          }}
          onSetSelectedBlocks={(blockIds) => {
            setMultiSelected(blockIds);
          }}
          onSelectBlock={onSelectBlock}
        />
      )}

      {/* Sidebar Portal for editing the main Hero block's properties - only show when no internal block is selected */}
      {!activeBlock && selected && (
        <SidebarPortal selected={selected}>
          <BlockDataForm
            block={block}
            schema={schema}
            title={schema.title}
            onChangeBlock={props.onChangeBlock} // This updates the top-level Hero block's data
            onChangeField={(id, value) => {
              // This `onChangeField` handles changes to properties directly on the main `data` object
              // of the Hero block (e.g., `isCarousel`, `copyright`, `fullWidth`, `buttonLabel`, `buttonLink`).
              onChangeBlock(block, {
                ...data,
                [id]: value,
              });
            }}
            formData={data}
            // `activeObject` and `setActiveObject` are used by BlockDataForm for tabs/sections.
            // In carousel mode, this controls which slide's main properties are shown in the sidebar.
            activeObject={
              isCarousel
                ? Math.min(
                    slideIndex,
                    Math.max(0, (data.slides || []).length - 1),
                  )
                : undefined // No specific activeObject for single block
            }
            setActiveObject={setSlideIndex} // Controls which slide's properties are displayed in sidebar
          />
        </SidebarPortal>
      )}
    </>
  );
}
