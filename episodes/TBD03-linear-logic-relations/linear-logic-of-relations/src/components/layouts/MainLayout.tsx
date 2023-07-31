import { ReactElement, useState } from "react";
import styled from "styled-components";

const MainLayoutContainer = styled.div`
    padding: 0 8px;
`;

const Header = styled.header`
    padding: 4px 0;
`;

const H1 = styled.header`
    padding: 0;
    margin: 0;
`;

const NavContainer = styled.div``;

type Props = {
    children: [heading: string, navigation: ReactElement, page: ReactElement];
};
export const MainLayout = ({ children }: Props) => {
    const [heading, nav, page] = children;

    return (
        <MainLayoutContainer>
            <Header>
                <H1>{heading}</H1>
                <NavContainer>{nav}</NavContainer>
            </Header>
            {page}
        </MainLayoutContainer>
    );
};
