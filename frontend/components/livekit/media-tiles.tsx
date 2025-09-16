import React, { useMemo } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  type TrackReference,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { AgentTile } from './agent-tile';
import { AvatarTile } from './avatar-tile';
import { VideoTile } from './video-tile';

const MotionVideoTile = motion.create(VideoTile);
const MotionAgentTile = motion.create(AgentTile);
const MotionAvatarTile = motion.create(AvatarTile);

const animationProps = {
  initial: {
    opacity: 0,
    scale: 0,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0,
  },
  transition: {
    type: 'spring',
    stiffness: 675,
    damping: 75,
    mass: 1,
  },
};

const classNames = {
  // GRID
  // 2 Columns x 3 Rows
  grid: [
    'h-full w-full',
    'grid gap-x-2 place-content-center',
    'grid-cols-[1fr_1fr] grid-rows-[90px_1fr_90px]',
  ],

  agentChatOpenWithSecondTile: ['col-start-1 row-start-1', 'self-center justify-self-end'],
  agentChatOpenWithoutSecondTile: ['col-start-1 row-start-1', 'col-span-2', 'place-content-center'],
  agentChatClosed: ['col-start-1 row-start-1', 'col-span-2 row-span-3', 'place-content-center'],
  secondTileChatOpen: ['col-start-2 row-start-1', 'self-center justify-self-start'],
  secondTileChatClosed: ['col-start-2 row-start-3', 'place-content-end'],
};

export function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  const trackRef = useMemo<TrackReference | undefined>(
    () => (publication ? { source, participant: localParticipant, publication } : undefined),
    [source, publication, localParticipant]
  );
  return trackRef;
}

interface MediaTilesProps {
  chatOpen: boolean;
  streamingPanelOpen?: boolean;
}

export function MediaTiles({ chatOpen = true }: MediaTilesProps) {
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack: TrackReference | undefined = useLocalTrackRef(Track.Source.Camera);

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;
  const hasSecondTile = isCameraEnabled || isScreenShareEnabled;

  const transition = {
    ...animationProps.transition,
    delay: chatOpen ? 0 : 0.15, // delay on close
  };
  const agentAnimate = {
    ...animationProps.animate,
    scale: chatOpen ? 1 : 3,
    transition,
  };
  const avatarAnimate = {
    ...animationProps.animate,
    transition,
  };
  const agentLayoutTransition = transition;
  const avatarLayoutTransition = transition;

  const isAvatar = agentVideoTrack !== undefined;

  return (
    <div className="h-full w-full">
      <div className="relative mx-auto h-full max-w-2xl px-4 md:px-0">
        <div className={cn(classNames.grid)}>
          {/* agent */}
          <div
            className={cn([
              'grid',
              // 'bg-[hotpink]', // for debugging
              !chatOpen && classNames.agentChatClosed,
              chatOpen && hasSecondTile && classNames.agentChatOpenWithSecondTile,
              chatOpen && !hasSecondTile && classNames.agentChatOpenWithoutSecondTile,
            ])}
          >
            <AnimatePresence mode="popLayout">
              {!isAvatar && (
                // audio-only agent
                <MotionAgentTile
                  key="agent"
                  layoutId="agent"
                  {...animationProps}
                  animate={agentAnimate}
                  transition={agentLayoutTransition}
                  state={agentState}
                  audioTrack={agentAudioTrack}
                  className={cn(chatOpen ? 'h-[90px]' : 'h-auto w-full')}
                />
              )}
              {isAvatar && (
                // avatar agent
                <MotionAvatarTile
                  key="avatar"
                  layoutId="avatar"
                  {...animationProps}
                  animate={avatarAnimate}
                  transition={avatarLayoutTransition}
                  videoTrack={agentVideoTrack}
                  className={cn(
                    chatOpen ? 'h-[90px] [&>video]:h-[90px] [&>video]:w-auto' : 'h-auto w-full'
                  )}
                />
              )}
            </AnimatePresence>
          </div>

          <div
            className={cn([
              'grid',
              chatOpen && classNames.secondTileChatOpen,
              !chatOpen && classNames.secondTileChatClosed,
            ])}
          >
            {/* camera */}
            <AnimatePresence>
              {cameraTrack && isCameraEnabled && (
                <MotionVideoTile
                  key="camera"
                  layout="position"
                  layoutId="camera"
                  {...animationProps}
                  trackRef={cameraTrack}
                  transition={{
                    ...animationProps.transition,
                    delay: chatOpen ? 0 : 0.15,
                  }}
                  className="h-[90px]"
                />
              )}
              {/* screen */}
              {isScreenShareEnabled && (
                <MotionVideoTile
                  key="screen"
                  layout="position"
                  layoutId="screen"
                  {...animationProps}
                  trackRef={screenShareTrack}
                  transition={{
                    ...animationProps.transition,
                    delay: chatOpen ? 0 : 0.15,
                  }}
                  className="h-[90px]"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
