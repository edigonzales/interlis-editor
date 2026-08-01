import '../../src/browser/style/index.css';

import { AboutDialog } from '@theia/core/lib/browser/about-dialog';
import { WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { InterlisEditorAboutDialog } from './interlis-editor-about-dialog';
import { InterlisEditorGettingStartedWidget } from './interlis-editor-getting-started-widget';

export default new ContainerModule((bind, _unbind, isBound, rebind) => {
    bind(InterlisEditorGettingStartedWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: GettingStartedWidget.ID,
        createWidget: () => context.container.get(InterlisEditorGettingStartedWidget),
    })).inSingletonScope();

    if (isBound(AboutDialog)) {
        rebind(AboutDialog).to(InterlisEditorAboutDialog).inSingletonScope();
    } else {
        bind(AboutDialog).to(InterlisEditorAboutDialog).inSingletonScope();
    }
});
