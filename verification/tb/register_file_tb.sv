`timescale 1ns / 1ps

module register_file_tb;

logic clk;
logic we;

logic [4:0] rs1;
logic [4:0] rs2;
logic [4:0] rd;

logic [31:0] write_data;
logic [31:0] read_data1;
logic [31:0] read_data2;

register_file dut(

    .clk(clk),
    .we(we),

    .rs1(rs1),
    .rs2(rs2),
    .rd(rd),

    .write_data(write_data),

    .read_data1(read_data1),
    .read_data2(read_data2)

);

initial begin
    clk=0;
    forever #5 clk=~clk;
end

initial begin

    $display("===============================");
    $display(" Register File Test Started");
    $display("===============================");

    we=0;
    rs1=0;
    rs2=0;
    rd=0;
    write_data=0;

    #10;

    // Write x1
    we=1;
    rd=5'd1;
    write_data=32'h11111111;

    #10;

    // Write x2
    rd=5'd2;
    write_data=32'h22222222;

    #10;

    we=0;

    rs1=5'd1;
    rs2=5'd2;

    #5;

    if(read_data1==32'h11111111)
        $display("[PASS] Register x1");
    else
        $display("[FAIL] Register x1");

    if(read_data2==32'h22222222)
        $display("[PASS] Register x2");
    else
        $display("[FAIL] Register x2");

    // Verify x0

    rs1=5'd0;

    #5;

    if(read_data1==32'h00000000)
        $display("[PASS] Register x0 Always Zero");
    else
        $display("[FAIL] Register x0");

    $display("===============================");
    $display(" Register File Test Complete");
    $display("===============================");

    $finish;

end

endmodule