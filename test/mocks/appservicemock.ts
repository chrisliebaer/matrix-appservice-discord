import { IMatrixEvent } from "../../src/matrixtypes";

/* tslint:disable:no-unused-expression no-any */

interface IAppserviceMockOpts {
    roommembers?: IMatrixEvent[];
    stateEventFetcher?: (roomId, stateType, stateKey) => Promise<any>;
    eventFetcher?: (roomId, eventId) => Promise<any>;
    profileFetcher?: (userId) => Promise<any>;
    botUserId?: string;
    userIdPrefix?: string;
}

class AppserviceMockBase {
    private calls: {[key: string]: [any[]]} = {};

    public wasCalled(funcName: string, throwOnMissing: boolean = true, ...args: any[]): number {
        const called = this.calls[funcName];
        if (!called && throwOnMissing) {
            throw Error(`${funcName} was not called`);
        } else if (!called) {
            return 0;
        } else if (args.length === 0) {
            return called.length;
        }
        const calls = called.filter((callArgs) => {
            const j1 = JSON.stringify(callArgs);
            const j2 = JSON.stringify(args);
            return j1 === j2;
        }).length;
        if (calls === 0 && throwOnMissing) {
            throw Error(`${funcName} was not called with the correct parameters`);
        }
        return calls;
    }

    public wasNotCalled(funcName: string, throwOnFound: boolean = true, ...args: any[]): boolean {
        if (this.wasCalled(funcName, false, args)) {
            if (throwOnFound) {
                throw Error(`${funcName} was called`);
            }
            return false;
        }
        return true;
    }

    protected funcCalled(funcName: string, ...args: any[]) {
        this.calls[funcName] = this.calls[funcName] || [];
        this.calls[funcName].push(args);
    }
}

export class AppserviceMock extends AppserviceMockBase {
    public botIntent: IntentMock;
    public intents: {[id: string]: IntentMock};

    public get botUserId(): string {
        return this.opts.botUserId || "@bot:localhost";
    }

    constructor(private opts: IAppserviceMockOpts = {}) {
        super();
        opts.roommembers = opts.roommembers || [];
        this.intents = {};
        this.botIntent = new IntentMock(this.opts);
    }

    public isNamespacedUser(userId: string) {
        this.funcCalled("isNamespacedUser", userId);
        if (this.opts.userIdPrefix) {
            return userId.startsWith(this.opts.userIdPrefix);
        }
        throw Error("No prefix defined");
    }

    public getIntentForSuffix(prefix: string) {
        this.funcCalled("getIntentForSuffix", prefix);
        if (!this.intents[prefix]) {
            this.intents[prefix] = new IntentMock(this.opts);
        }
        return this.intents[prefix];
    }

    public getIntent(userId: string) {
        this.funcCalled("getIntent", userId);
        if (!this.intents[userId]) {
            this.intents[userId] = new IntentMock(this.opts);
        }
        return this.intents[userId];
    }
}

class IntentMock extends AppserviceMockBase {
    public readonly underlyingClient: MatrixClientMock;
    constructor(private opts: IAppserviceMockOpts = {}) {
        super();
        this.underlyingClient = new MatrixClientMock();
    }

    public join() {
        this.funcCalled("join");
    }

    public joinRoom() {
        this.funcCalled("joinRoom");
    }

    public leave() {
        this.funcCalled("leave");
    }

    public sendText(roomId: string, body: string) {
        this.funcCalled("sendText", roomId, body);
    }

    public sendEvent(roomId: string, body: string) {
        this.funcCalled("sendEvent", roomId, body);
    }
}

class MatrixClientMock extends AppserviceMockBase {

    constructor(private opts: IAppserviceMockOpts = {}) {
        super();
    }

    public banUser(roomId: string, userId: string) {
        this.funcCalled("banUser", roomId, userId);
    }

    public sendMessage(roomId: string, eventContent: IMatrixEvent) {
        this.funcCalled("sendMessage", roomId, eventContent);
    }

    public sendEvent(roomId: string, body: string, msgtype: string) {
        this.funcCalled("sendEvent", roomId, body, msgtype);
    }

    public getRoomMembers(roomId: string) {
        this.funcCalled("getRoomMembers", roomId);
        return {
            chunk: this.opts.roommembers!,
        };
    }

    public leaveRoom(roomId: string) {
        this.funcCalled("leaveRoom", roomId);
    }

    public kickUser(roomId: string, userId: string) {
        this.funcCalled("kickUser", roomId, userId);
    }

    public sendStateEvent(roomId: string, type: string, stateKey: string, content: {}) {
        this.funcCalled("sendStateEvent", roomId, type, stateKey, content);
    }

    public setAvatarUrl(avatarUrl: string) {
        this.funcCalled("setAvatarUrl", avatarUrl);
    }

    public setDisplayName(displayName: string) {
        this.funcCalled("setDisplayName", displayName);
    }

    public async getUserProfile(userId: string) {
        this.funcCalled("getUserProfile", userId);
        if (this.opts.profileFetcher) {
            return await this.opts.profileFetcher(userId);
        }
        throw Error("No stateEventFetcher defined");
    }

    public async uploadContent(data: Buffer, contentType: string, filename: string) {
        this.funcCalled("uploadContent", data, contentType, filename);
        return "mxc://" + filename;
    }

    public async mxcUrlToHttp(mxcUrl: string) {
        this.funcCalled("mxcUrlToHttp", mxcUrl);
        return mxcUrl.replace("mxc://", "https://");
    }

    public async getRoomStateEvent(roomId: string, type: string, stateKey: string): Promise<any> {
        this.funcCalled("getRoomStateEvent", roomId, type, stateKey);
        if (this.opts.stateEventFetcher) {
            return await this.opts.stateEventFetcher(roomId, type, stateKey);
        }
        throw Error("No stateEventFetcher defined");
    }

    public async getEvent(roomId: string, eventId: string): Promise<any> {
        this.funcCalled("getEvent", roomId, eventId);
        if (this.opts.eventFetcher) {
            return await this.opts.eventFetcher(roomId, eventId);
        }
        throw Error("No getEvent defined");
    }

    public unbanUser(roomId: string, userId: string) {
        this.funcCalled("unbanUser", roomId, userId);
    }
}
