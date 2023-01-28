export default function shouldUpdateComponent(n1, n2) {
  const { props: prevProps } = n1;
  const { props: nextProps } = n2;
  for (let key in nextProps) {
    if (prevProps[key]!== nextProps[key]) {
      return true;
    }
  }
  return false;
}
