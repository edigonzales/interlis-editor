import * as React from 'react';

interface ExternalLinkProps {
    readonly href: string;
    readonly children: React.ReactNode;
}

function ExternalLink({ href, children }: ExternalLinkProps): JSX.Element {
    return <a href={href} target='_blank' rel='noreferrer'>{children}</a>;
}

export function renderProductName(): React.ReactNode {
    return <div className='interlis-editor-heading'>
        <h1>INTERLIS Editor</h1>
        <p>Model INTERLIS schemas with language-aware editing and diagrams.</p>
    </div>;
}

export function renderIntroduction(): React.ReactNode {
    return <section className='interlis-editor-section'>
        <h3>Model INTERLIS schemas</h3>
        <p>
            Create or open an <code>.ili</code> file to use completion, diagnostics,
            compilation, documentation exports and model diagrams provided by the
            built-in INTERLIS Language Tools extension.
        </p>
    </section>;
}

export function renderResources(): React.ReactNode {
    return <section className='interlis-editor-section'>
        <h3>Resources</h3>
        <ul>
            <li><ExternalLink href='https://github.com/edigonzales/interlis-language-tools'>INTERLIS language tooling</ExternalLink></li>
            <li><ExternalLink href='https://github.com/edigonzales/interlis-editor'>INTERLIS Editor source code</ExternalLink></li>
            <li><ExternalLink href='https://theia-ide.org/docs/'>Eclipse Theia documentation</ExternalLink></li>
        </ul>
    </section>;
}

export function renderAboutText(): React.ReactNode {
    return <>
        <p>
            INTERLIS Editor is a dedicated desktop environment for modelling
            INTERLIS models. It combines Eclipse Theia with the independently
            maintained INTERLIS Language Tools VS Code extension.
        </p>
        <p>
            Source code: <ExternalLink href='https://github.com/edigonzales/interlis-editor'>github.com/edigonzales/interlis-editor</ExternalLink>
        </p>
    </>;
}
