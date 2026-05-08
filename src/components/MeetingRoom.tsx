import React, { useEffect, useRef } from 'react';

interface MeetingRoomProps {
  roomName: string;
  displayName: string;
  onLeave: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ roomName, displayName, onLeave }) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      if (jitsiContainerRef.current && window.JitsiMeetExternalAPI) {
        // Clean up any existing iframe before creating a new one
        jitsiContainerRef.current.innerHTML = '';
        
        const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: `InterviewPortfolio_${roomName.replace(/[^a-zA-Z0-9]/g, '')}`,
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: displayName
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false, // Skip prejoin to jump right into the interview
            disableDeepLinking: true, // Prevent prompting to download the app
          },
          interfaceConfigOverwrite: {
            SHOW_CHROME_EXTENSION_BANNER: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'chat', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'tileview'
            ],
          }
        });

        api.addEventListener('videoConferenceLeft', () => {
          api.dispose();
          onLeave();
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (jitsiContainerRef.current) {
        jitsiContainerRef.current.innerHTML = '';
      }
    };
  }, [roomName, displayName, onLeave]);

  return (
    <div className="w-full h-full min-h-[600px] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl" ref={jitsiContainerRef} />
  );
};

export default MeetingRoom;
