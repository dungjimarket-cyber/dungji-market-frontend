interface Window {
  Kakao: {
    Link: {
      sendDefault: (options: {
        objectType: 'feed';
        content: {
          title: string;
          description: string;
          imageUrl: string;
          link: {
            mobileWebUrl: string;
            webUrl: string;
          };
        };
        buttons?: Array<{
          title: string;
          link: {
            mobileWebUrl: string;
            webUrl: string;
          };
        }>;
      }) => void;
    };
    init: (appKey: string) => void;
    isInitialized: () => boolean;
  };
}