import { Fiddle, FiddleFactory } from "@electron/fiddle-core";
import path from "path";

export class FiddleOctokitFactory extends FiddleFactory {
    constructor(fiddles: string) {
        super(fiddles);
    }

    public async fromRepo(url: string, checkout = 'master'): Promise<Fiddle> {
        const folder = path.join(this.fiddles, hashString(url));
        d({ url, checkout, folder });
    
        // get the repo
        if (!fs.existsSync(folder)) {
            d(`cloning "${url}" into "${folder}"`);
            const git = simpleGit();
            await git.clone(url, folder, { '--depth': 1 });
        }
    
        const git = simpleGit(folder);
        await git.checkout(checkout);
        await git.pull('origin', checkout);
    
        return new Promise<Fiddle>((resolve, reject) => {
            resolve(new Fiddle(path.join(folder, 'main.js'), url));
        });
    }
}
FiddleFactory.prototype.fromRepo = 