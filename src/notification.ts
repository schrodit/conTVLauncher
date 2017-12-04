import {app, BrowserWindow, ipcMain} from 'electron';
import * as url from 'url';
import * as path from 'path';

import {appMgmt} from './appMgmt';
import {tile, config} from './cfgMgmt';

type app = Electron.App;
type BrowserWindow = Electron.BrowserWindow;

export class Notification {
    aMgmt: appMgmt;
    win: BrowserWindow;

    type: string;
    message: string;

    constructor(aMgmt: appMgmt, type: string, message: string) {
        this.aMgmt = aMgmt;
        this.type = type;
        this.message = message;

        this.openWindow();
    }

    private openWindow() {
        this.win = new BrowserWindow({
            parent: this.aMgmt.win,
            modal: false,
            frame: false,
            height: 88,
            maxWidth: 500,
            y: -60,
            x: this.aMgmt.win.getSize()[0] / 2 - 250,
            show: false,
            hasShadow: true
        });       
        this.win.loadURL(url.format({
            protocol: 'file',
            slashes: true,
            pathname: path.join(__dirname, 'frontend', 'wrapper', 'notification.html'),
            query: {
                message: this.message,
                type: this.type
            }
        }));

        this.win.once('ready-to-show', () => {
            this.aMgmt.logger.info('Open notification');
            this.win.show();
            let xOff = (this.aMgmt.win.getSize()[0] / 2) - (this.win.getSize()[0] / 2 );
            let yOff = 20;

            this.win.setPosition(xOff, yOff, true);
            let int = setTimeout( () => {
                this.win.close();
            }, 3000);
        });
    }
}