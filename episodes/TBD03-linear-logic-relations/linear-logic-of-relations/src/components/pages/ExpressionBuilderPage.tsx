import styled from "styled-components/macro";
import { examples1 } from "../../logic/examples/expressions";
import { RenderRel } from "../RenderRel";
import { opApp } from "../../logic/syntaxTree";

const negR = opApp.neg(examples1.R);
const linNegR = opApp.linNeg(examples1.R);
const { conR, R, S } = examples1;
const conNegR = opApp.converse(negR);
const negConR = opApp.neg(conR);
const RandS = opApp.and(R, S);
const linNegRandRandS = opApp.and(linNegR, RandS);
const RcompS = opApp.comp(R, S);
const complexComposition1 = opApp.comp(linNegRandRandS, RcompS);

const PageContainer = styled.div``;

type Props = {};

export const ExamplesPage = ({}: Props) => {
    return <PageContainer></PageContainer>;
};
