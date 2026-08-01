import * as React from 'react';
import { AboutDialog, AboutDialogProps, ABOUT_CONTENT_CLASS } from '@theia/core/lib/browser/about-dialog';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VSXEnvironment } from '@theia/vsx-registry/lib/common/vsx-environment';
import { renderAboutText } from './branding-util';

@injectable()
export class InterlisEditorAboutDialog extends AboutDialog {

    @inject(VSXEnvironment)
    protected readonly environment!: VSXEnvironment;

    protected vscodeApiVersion = 'unknown';

    constructor(
        @inject(AboutDialogProps) protected readonly props: AboutDialogProps
    ) {
        super(props);
    }

    protected async doInit(): Promise<void> {
        this.vscodeApiVersion = await this.environment.getVscodeApiVersion();
        super.doInit();
    }

    protected render(): React.ReactNode {
        return <div className={ABOUT_CONTENT_CLASS}>
            <div className='interlis-about-layout'>
                <div className='interlis-about-logo' role='img' aria-label='INTERLIS Editor logo' />
                <div>
                    <h1>INTERLIS Editor</h1>
                    <p className='interlis-about-version'>
                        Version {this.applicationInfo?.version ?? 'unknown'}<br />
                        VS Code API {this.vscodeApiVersion}
                    </p>
                    {renderAboutText()}
                    <p>Copyright © 2026 INTERLIS Editor contributors</p>
                </div>
            </div>
            {this.renderExtensions()}
        </div>;
    }
}
