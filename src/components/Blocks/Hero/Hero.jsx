import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@plone/volto/components';
import volumeOff from '@plone/volto/icons/volume-off.svg';
import volumeUp from '@plone/volto/icons/volume.svg';
import { isInternalURL } from '@plone/volto/helpers/Url/Url';
import { isImageGif, getFieldURL } from 'volto-super-hero/helpers';
import { useFirstVisited } from 'volto-super-hero/hooks';
import cx from 'classnames';

Hero.propTypes = {
  image: PropTypes.any,
  video: PropTypes.any,
  fullWidth: PropTypes.bool,
  fullHeight: PropTypes.bool,
  alignContent: PropTypes.string,
  textAlign: PropTypes.string,
  metaAlign: PropTypes.string,
  backgroundColor: PropTypes.string,
  quoted: PropTypes.bool,
  textVariant: PropTypes.string,
};

function Hero({
  overlay = true,
  fullWidth = true,
  fullHeight = true,
  children,
  spaced = false,
  inverted = true,
  styles,
  height,
  backgroundColor,
  ...props
}) {
  const image = props.image;
  const videoUrl = getFieldURL(props.video);
  const videoRef = React.useRef(null);
  const [isMuted, setIsMuted] = React.useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };
  const isExternal = !isInternalURL(image);
  const { alignContent = 'center' } = styles || {};
  const bgImgRef = React.useRef();
  const onScreen = useFirstVisited(bgImgRef);
  const backgroundImageStyle = {
    ...(onScreen && image
      ? {
          backgroundImage: isExternal
            ? `url(${image})`
            : isImageGif(image)
              ? `url(${image}/@@images/image)`
              : `url(${image}/@@images/image/huge)`,
        }
      : {}),
    background: backgroundColor,
  };
  return (
    <div
      className={` eea hero-block ${fullHeight ? 'full-height' : ''}  ${
        spaced ? 'spaced' : ''
      }`}
    >
      <div
        className={`hero-block-image-wrapper ${
          fullWidth ? 'full-width' : ''
        } color-bg-${backgroundColor}`}
      >
        <div
          ref={bgImgRef}
          className={`hero-block-image ${styles?.bg}`}
          style={backgroundImageStyle}
        >
          {videoUrl && (
            <div className="video-container">
              <video ref={videoRef} autoPlay loop muted playsInline>
                <source src={videoUrl} type="video/mp4" />
              </video>
              <button className="volume-button" onClick={toggleMute}>
                <Icon name={isMuted ? volumeOff : volumeUp} size="32px" />
              </button>
            </div>
          )}
          {image && !videoUrl && overlay && (
            <div className="hero-block-image-overlay dark-overlay-4"></div>
          )}
        </div>
      </div>
      <div
        className={`hero-block-inner-wrapper d-flex ui container flex-items-${alignContent}`}
      >
        <div className="hero-block-body">{children}</div>
      </div>
    </div>
  );
}

Hero.Text = ({ quoted, styles, children }) => {
  const { textVariant = 'white', textAlign = 'left' } = styles || {};
  return (
    <div
      className={cx(
        'hero-block-text',
        `color-fg-${textVariant}`,
        `text-${textAlign}`,
        quoted ? 'quoted-wrapper' : '',
      )}
    >
      {children}
    </div>
  );
};
Hero.Meta = ({ metaAlign, children }) => (
  <div className={`hero-block-meta text-${metaAlign}`}>{children}</div>
);

export default Hero;
