import styled from "styled-components";
import { examples1 } from "../logic/examples/expressions";
import { Atom } from "./RenderRel/Atom";

const PageContainer = styled.div``;

type Props = {};

export const Page = ({}: Props) => {
    return (
        <PageContainer>
            <Atom>{examples1.R}</Atom>
        </PageContainer>
    );
};
