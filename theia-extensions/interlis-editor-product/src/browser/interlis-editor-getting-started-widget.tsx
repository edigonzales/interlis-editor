import * as React from 'react';
import { Message } from '@theia/core/lib/browser';
import { PreferenceService } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { VSXEnvironment } from '@theia/vsx-registry/lib/common/vsx-environment';
import { renderIntroduction, renderProductName, renderResources } from './branding-util';

@injectable()
export class InterlisEditorGettingStartedWidget extends GettingStartedWidget {

    @inject(VSXEnvironment)
    protected readonly environment: VSXEnvironment;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected vscodeApiVersion = 'unknown';

    protected async doInit(): Promise<void> {
        super.doInit();
        this.vscodeApiVersion = await this.environment.getVscodeApiVersion();
        await this.preferenceService.ready;
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        document.getElementById('alwaysShowWelcomePage')?.focus();
    }

    protected render(): React.ReactNode {
        return <div className='gs-container interlis-editor-welcome'>
            <div className='gs-content-container'>
                <div className='gs-float interlis-editor-actions'>
                    <div className='interlis-editor-logo' role='img' aria-label='INTERLIS Editor logo' />
                    {this.renderActions()}
                </div>
                {renderProductName()}
                <p className='interlis-editor-version'>
                    Version {this.applicationInfo?.version ?? 'unknown'} · VS Code API {this.vscodeApiVersion}
                </p>
                <hr className='gs-hr' />
                {renderIntroduction()}
                {renderResources()}
            </div>
            <div className='gs-preference-container'>
                {this.renderPreferences()}
            </div>
        </div>;
    }

    protected renderActions(): React.ReactNode {
        return <div className='gs-container'>
            <div className='flex-grid'><div className='col'>{this.renderStart()}</div></div>
            <div className='flex-grid'><div className='col'>{this.renderRecentWorkspaces()}</div></div>
            <div className='flex-grid'><div className='col'>{this.renderSettings()}</div></div>
            <div className='flex-grid'><div className='col'>{this.renderHelp()}</div></div>
        </div>;
    }
}
