import React, { useCallback, useEffect, useState } from "react";
import { Message } from "semantic-ui-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useMemo } from "react";
import cx from "classnames";
import { defineMessages, useIntl } from "react-intl";
import { Icon } from "semantic-ui-react";
import { UniversalLink, RenderBlocks } from "@plone/volto/components";
import { BodyClass } from "@plone/volto/helpers";
import { useLocation } from "react-router-dom";
import Hero from "./Hero";
import Copyright from "./Copyright";
import { serializeText, getFieldURL } from "luna-super-hero/helpers";
import config from "@plone/volto/registry";
import "./hero.less";

const messages = defineMessages({
  PleaseChooseContent: {
    id: "Please choose an existing content as source for this element",
    defaultMessage:
      "Please choose an existing content as source for this element",
  },
  previousButton: {
    id: "Previous slide",
    defaultMessage: "Previous slide",
  },
  nextButton: {
    id: "Next slide",
    defaultMessage: "Next slide",
  },
  goToSlide: {
    id: "Go to slide",
    defaultMessage: "Go to slide",
  },
});
const Metadata = ({ buttonLabel, inverted, styles, ...props }) => {
  const buttonLink = getFieldURL(props.buttonLink);
  const { buttonVariant = "white" } = styles || {};

  return buttonLabel ? (
    <UniversalLink
      className={cx("ui button", buttonVariant, { inverted })}
      href={buttonLink || ""}
    >
      {buttonLabel}
    </UniversalLink>
  ) : (
    ""
  );
};

// Carousel Controls Components (like in volto-slider-block)
const DotButton = (props) => {
  const { children, index, ...restProps } = props;
  const intl = useIntl();

  return (
    <button
      type="button"
      {...restProps}
      aria-label={`${intl.formatMessage(messages.goToSlide)} ${index + 1}`}
    >
      {children}
    </button>
  );
};

const PrevButton = (props) => {
  const { children, ...restProps } = props;
  const intl = useIntl();

  return (
    <button
      className="hero-slider-button hero-slider-button-prev"
      type="button"
      aria-label={intl.formatMessage(messages.previousButton)}
      {...restProps}
    >
      <Icon name="arrow left" />
      {children}
    </button>
  );
};

const NextButton = (props) => {
  const { children, ...restProps } = props;
  const intl = useIntl();

  return (
    <button
      className="hero-slider-button hero-slider-button-next"
      type="button"
      aria-label={intl.formatMessage(messages.nextButton)}
      {...restProps}
    >
      <Icon name="arrow right" />
      {children}
    </button>
  );
};

const View = (props) => {
  const {
    className,
    data,
    isEditMode = false,
    block,
    openObjectBrowser,
    onChangeBlock,
    slideIndex,
    setSlideIndex,
  } = props;
  const intl = useIntl();
  const location = useLocation();

  const {
    text,
    copyright,
    copyrightIcon,
    copyrightPosition,
    isCarousel,
    slides = [],
    autoPlay,
    autoPlaySpeed = 5000,
    showDots = true,
    showArrows = true,
  } = data;
  const metadata = props.metadata || props.properties;
  const copyrightPrefix = config.blocks.blocksConfig.hero.copyrightPrefix || "";

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const autoplay = autoPlay !== undefined ? autoPlay : false;

  const autoplayInstance = useMemo(
    () =>
      autoplay && !isEditMode
        ? Autoplay(
            {
              delay: Number(autoPlaySpeed) || 5000,
              playOnInit: true,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              stopOnLastSnap: false,
            },
            (emblaRoot) => emblaRoot.parentElement
          )
        : null,
    [autoplay, isEditMode, autoPlaySpeed]
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      containScroll: "trimSnaps",
    },
    [autoplayInstance].filter(Boolean)
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      setSlideIndex && setSlideIndex(selectedIndex - 1);
    }
  }, [emblaApi, selectedIndex, setSlideIndex]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext();
      setSlideIndex && setSlideIndex(selectedIndex + 1);
    }
  }, [emblaApi, selectedIndex, setSlideIndex]);

  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) {
        emblaApi.scrollTo(index);
        setSlideIndex && setSlideIndex(index);
      }
    },
    [emblaApi, setSlideIndex]
  );

  const onInit = useCallback((emblaApi) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("reInit", onInit);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onInit, onSelect]);

  useEffect(() => {
    // This syncs the current slide with the objectwidget (or other sources
    // able to access the slider context)
    // that can modify the SliderContext (and come here via props slideIndex)
    if (isEditMode) {
      scrollTo(slideIndex);
    }
  }, [slideIndex, scrollTo, isEditMode]);

  const sliderContainerWidth = emblaApi
    ?.rootNode()
    .getBoundingClientRect().width;

  // Render single hero (non-carousel mode)
  const renderSingleHero = () => (
    <>
      <BodyClass className="with-hero-block" />
      <Hero
        {...data}
        image={data.image}
        video={data.video}
        className={cx("hero-single", data.fullWidth ? "has-full-width" : "")}
      >
        <Hero.Text {...data.styles}>
          {data?.data ? (
            <RenderBlocks
              location={location}
              metadata={metadata}
              content={data?.data || {}}
            />
          ) : (
            serializeText(text)
          )}
        </Hero.Text>
        <Hero.Meta metaAlign={data.styles?.buttonAlign}>
          <Metadata {...data} />
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
          ""
        )}
      </Hero>
    </>
  );

  // Render carousel with hero slides (like volto-slider-block structure)
  const renderCarouselHero = () => (
    <div
      className={cx(
        "hero-carousel-edit-wrapper hero-block",
        data.fullHeight ? "full-height" : "",
        data.spaced ? "spaced" : "",
        data.fullWidth ? "has-full-width" : ""
      )}
    >
      <BodyClass className="with-hero-block" />
      <div
        className={cx(
          "block hero-slider hero-block",
          data.fullHeight ? "full-height" : "",
          data.spaced ? "spaced" : "",
          data.fullWidth ? "has-full-width" : "",
          className
        )}
        style={{ "--slider-container-width": `${sliderContainerWidth}px` }}
      >
        {(slides?.length === 0 || !slides) && isEditMode && (
          <Message>
            <div className="hero-item default">
              <p>{intl.formatMessage(messages.PleaseChooseContent)}</p>
            </div>
          </Message>
        )}
        {slides?.length > 0 && (
          <>
            <div className="hero-slider-wrapper">
              {showArrows && slides?.length > 1 && (
                <>
                  <PrevButton onClick={scrollPrev} disabled={prevBtnDisabled} />
                  <NextButton onClick={scrollNext} disabled={nextBtnDisabled} />
                </>
              )}

              <div className="hero-slider-viewport" ref={emblaRef}>
                <div className="hero-slider-container">
                  {slides &&
                    slides.map((slide, index) => {
                      const slideStyles = slide.styles || {};
                      console.log({ slide });
                      const slideData = {
                        // Slide-specific properties from slide object itself
                        image: slide.image,
                        backgroundColor: slide.backgroundColor,
                        video: slide.video,
                        overlay:
                          slide.overlay !== undefined
                            ? slide.overlay
                            : data.overlay,
                        inverted:
                          slide.inverted !== undefined
                            ? slide.inverted
                            : data.inverted,
                        quoted:
                          slide.quoted !== undefined
                            ? slide.quoted
                            : data.quoted,
                        height: slide.height || data.height,
                        fullWidth: data.fullWidth, // Global fullWidth for all slides
                        // Slides don't have individual fullHeight/spaced - these are global
                        fullHeight: false,
                        spaced: false,
                        // Slide styling from slide.styles
                        styles: slideStyles,
                      };

                      return (
                        <div
                          key={slide.id || index}
                          className="hero-slider-slide"
                        >
                          <Hero
                            {...slideData}
                            className={cx("hero-slide-item", {
                              "slide-visible": selectedIndex === index,
                            })}
                          >
                            <Hero.Text {...slideStyles}>
                              {slide?.data ? (
                                <RenderBlocks
                                  location={location}
                                  metadata={metadata}
                                  content={slide?.data || {}}
                                />
                              ) : (
                                serializeText(slide.text)
                              )}
                            </Hero.Text>
                            <Hero.Meta
                              metaAlign={
                                slideStyles?.buttonAlign ||
                                data.styles?.buttonAlign
                              }
                            >
                              <Metadata {...data} styles={slideStyles} />
                            </Hero.Meta>
                            {copyright ? (
                              <Copyright copyrightPosition={copyrightPosition}>
                                <Copyright.Prefix>
                                  {copyrightPrefix}
                                </Copyright.Prefix>
                                <Copyright.Icon>
                                  <Icon className={copyrightIcon} />
                                </Copyright.Icon>
                                <Copyright.Text>{copyright}</Copyright.Text>
                              </Copyright>
                            ) : (
                              ""
                            )}
                            {slides?.length > 1 && (
                              <div className="hero-slider-dots">
                                {slides.map((_, index) => (
                                  <DotButton
                                    key={index}
                                    index={index}
                                    onClick={() => scrollTo(index)}
                                    className={"hero-slider-dot".concat(
                                      index === selectedIndex
                                        ? " hero-slider-dot--selected"
                                        : ""
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                          </Hero>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Return based on carousel mode
  if (isCarousel) {
    return renderCarouselHero();
  }

  return renderSingleHero();
};

export default View;
