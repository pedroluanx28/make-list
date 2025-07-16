// tipar as coisas de acordo com o que for fazendo, é muita coisa tá maluco KKKKKKKKKKK

type CommonFunctions = {
    socket: any;
    remoteJid: string;
    userJid: string;
    prefix: any;
    commandName: any;
    fullMessage: string;
    args: any;
    isReply: boolean;
    isAudio: boolean;
    isImage: boolean;
    isVideo: boolean;
    isSticker: boolean;
    fullArgs: string;
    replyJid: string;
    webMessage: any;
    sendText: (text: string, mentions?: string[]) => Promise<void>;
    sendReply: (text: string, mentions?: string[]) => Promise<void>;
    sendReact: (emoji: string) => Promise<void>;
    sendSuccessReact: any;
    sendWaitReact: any;
    sendWarningReact: any;
    sendErrorReact: any;
    sendSuccessReply: any;
    sendErrorReply: any;
    sendWarningReply: any;
    isGroup: boolean;
    getGroupParticipants: () => Promise<Participant[]>;
};

type Participant = {
    id: string;
    admin: string;
}
