
import serverAppFactory from '../../server/server-app.js';

/**
 * @type {module:server/ServerApp}
 */
const app = serverAppFactory('music');
export default app;

// tags:
//   full sync to sqlite db: https://www.npmjs.com/package/sync-music-db-bs3
//   sufficient: https://www.npmjs.com/package/node-id3
//   complete: https://www.npmjs.com/package/music-metadata

// player:
//   https://www.npmjs.com/package/stupid-player

/**
 * Initialize the package
 *
 * @returns {module:server/ServerApp} the app
 */
export async function init() {
    app.setState({
        playing: {
            file: '/truc.mp3',
            title: 'my title',
            artist: 'artist',
            album: 'album',
            year: '1991'
        },
        currentFolder: '/',
        folderContent: {
            'truc.mp3': {
                'title': 'my title',
                'url': '/truc.mp3',
                'isFolder': false
            },
            'truc2.mp3': {
                'title': 'my title 2',
                'url': '/truc2.mp3',
                'isFolder': false
            }
        }
    });

    return app;
}

init();
